import mongoose from "mongoose";
import { Promo } from "../models/promo.js";
import { Vendor } from "../models/vendor.js";
import { sendVendorSubmissionEmails } from "../utils/sendEmailNotification.js";
import { Participant } from "../models/participant.js";
import { Sponsor } from "../models/sponser.js";
import cron from "node-cron";
import { TABLES, getBoothMeta } from "../config/booth.js";

const BASE_URL = "https://social-be-roan.vercel.app";

export function setupExpiryCleanupJob() {
  cron.schedule("*/15 * * * *", async () => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await releaseExpiredHolds(session);
      await session.commitTransaction();
      console.log("✅ Expired holds cleaned up");
    } catch (error) {
      await session.abortTransaction();
      console.error("❌ Failed to clean expired holds:", error);
    } finally {
      session.endSession();
    }
  });
}

setupExpiryCleanupJob();

const numOnly = (v) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
};

export async function getStats(req, res) {
  const [total, submitted, approved] = await Promise.all([
    Vendor.countDocuments(),
    Vendor.countDocuments({ status: "submitted" }),
    Vendor.countDocuments({ status: "approved" }),
  ]);
  res.json({ total, submitted, approved });
}

export async function listVendors(req, res) {
  const { q, status, category, page = "1", limit = "20" } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (q) {
    filter.$or = [
      { vendorName: { $regex: q, $options: "i" } },
      { "contact.personName": { $regex: q, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Vendor.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Vendor.countDocuments(filter),
  ]);

  const normalizedItems = items.map(normalizeVendor);

  res.json({
    items: normalizedItems,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
}

function groupFiles(files) {
  if (!files) return {};
  if (!Array.isArray(files) && typeof files === "object") return files;

  if (Array.isArray(files)) {
    const grouped = {};
    for (const f of files) {
      const key = f.fieldname || "unknown";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(f);
    }
    return grouped;
  }

  return {};
}

// Vendor-only expiry: if heldUntil passed, mark vendor expired.
// That automatically "frees" the booth because the unique index no longer applies.
async function releaseExpiredHolds(session) {
  const now = new Date();
  await Vendor.updateMany(
    { status: "held", "bookingTimeline.heldUntil": { $lt: now } },
    { $set: { status: "expired" } },
    { session }
  );
}

export async function createVendor(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const b = req.body || {};
    const filesGrouped = groupFiles(req.files);

    // Validate required fields (keep same)
    const missing = [];
    if (!b.personName) missing.push("personName");
    if (!b.vendorName) missing.push("vendorName");
    if (!b.email) missing.push("email");
    if (!b.phone) missing.push("phone");
    if (b.isOakville === undefined || b.isOakville === "") missing.push("isOakville");
    if (!b.selectedEvent) missing.push("selectedEvent");
    if (!b.category) missing.push("category");
    if (!b.boothNumber) missing.push("boothNumber");

    if (b.category === "Food Vendor" && !b.foodItems) missing.push("foodItems");
    if (b.category === "Clothing Vendor" && !b.clothingType) missing.push("clothingType");
    if (b.category === "Jewelry Vendor" && !b.jewelryType) missing.push("jewelryType");
    if (b.category === "Craft Booth" && !b.craftDetails) missing.push("craftDetails");

    if (missing.length) {
      await session.abortTransaction();
      return res.status(400).json({
        error: "Missing required fields",
        missing,
        received: Object.keys(b),
      });
    }

    // Validate boothNumber format
    const boothNumberNum = Number(b.boothNumber);
    if (Number.isNaN(boothNumberNum)) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Invalid boothNumber" });
    }

    // Expire old holds first (so booth becomes available if last hold expired)
    await releaseExpiredHolds(session);

    // Validate booth against fixed TABLES + category match
    const boothMeta = getBoothMeta(b.boothNumber, b.category);
    console.log("boothMeta", boothMeta)
    if (!boothMeta) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Invalid boothNumber (not in fixed booth list)" });
    }
    if (boothMeta.error === "CATEGORY_NOT_SUPPORTED") {
      await session.abortTransaction();
      return res.status(400).json({
        error: "Category not supported for booth booking (no booths defined for this category)",
        submittedCategory: b.category,
      });
    }
    if (boothMeta.error === "CATEGORY_MISMATCH") {
      await session.abortTransaction();
      return res.status(400).json({
        error: "Booth category mismatch",
        submittedCategory: b.category,
        boothCategory: boothMeta.booth?.category,
      });
    }

    // Promo logic (same)
    let promoCode, promoDiscount, promoDiscountType;
    const incomingPromo = (b.promoCode || "").toString().trim();

    if (incomingPromo) {
      const promo = await Promo.findOne({
        code: incomingPromo.toUpperCase(),
        active: true,
      }).session(session);

      if (!promo) {
        await session.abortTransaction();
        return res.status(400).json({ error: "Invalid promo code" });
      }

      const now = new Date();
      if (promo.startsAt && now < new Date(promo.startsAt)) {
        await session.abortTransaction();
        return res.status(400).json({ error: "Promo code not yet active", startsAt: promo.startsAt });
      }
      if (promo.endsAt && now > new Date(promo.endsAt)) {
        await session.abortTransaction();
        return res.status(400).json({ error: "Promo code has expired", endedAt: promo.endsAt });
      }

      promoCode = promo.code;
      promoDiscount = promo.discount;
      promoDiscountType = promo.discountType || "percent";
    }

    // FIXED uploads (keep your logic)
    const logoPath = filesGrouped.businessLogo?.[0]?.path || filesGrouped["businessLogo"]?.[0]?.path;

    const foodPhotoPaths = (filesGrouped.foodPhotos || filesGrouped["foodPhotos[]"] || [])
      .map((f) => f.path)
      .filter(Boolean);

    const clothingPhotoPaths = (filesGrouped.clothingPhotos || filesGrouped["clothingPhotos[]"] || [])
      .map((f) => f.path)
      .filter(Boolean);

    const jewelryPhotoPaths = (filesGrouped.jewelryPhotos || filesGrouped["jewelryPhotos[]"] || [])
      .map((f) => f.path)
      .filter(Boolean);

    const craftPhotoPaths = (filesGrouped.craftPhotos || filesGrouped["craftPhotos[]"] || [])
      .map((f) => f.path)
      .filter(Boolean);

    // IMPORTANT: pricing BASE comes from booth catalog (ignore FE amountToPay)
    const baseAmount = boothMeta.boothPrice;
    let finalAmount = baseAmount;

    if (promoDiscount) {
      if (promoDiscountType === "flat") {
        finalAmount = Math.max(0, baseAmount - promoDiscount);
      } else {
        finalAmount = Math.max(0, baseAmount - (baseAmount * promoDiscount) / 100);
      }
    }

    const now = new Date();
    const heldUntil = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const vendorDoc = {
      selectedEvent: b.selectedEvent,
      vendorName: b.vendorName,
      contact: {
        personName: b.personName,
        email: b.email,
        phone: b.phone,
        isOakville: String(b.isOakville).toLowerCase() === "yes" || b.isOakville === true,
      },
      socials: {
        instagram: b.instagram || undefined,
        facebook: b.facebook || undefined,
      },
      category: b.category,

      businessLogoPath: logoPath,

      boothNumber: boothMeta.boothNumber, // string (same as before)
      boothPrice: boothMeta.boothPrice,
      boothTableCategory: boothMeta.boothTableCategory,

      pricing: {
        base: baseAmount,
        promoCode,
        promoDiscount,
        promoDiscountType,
        final: finalAmount,
      },

      bookingTimeline: {
        submittedAt: now,
        heldUntil: heldUntil,
      },

      notes: b.notes,
      termsAcceptedAt: (String(b.terms).toLowerCase() === "true" || b.terms === true) ? now : undefined,
      status: "held",
    };

    // category-specific data (same)
    if (b.category === "Food Vendor") {
      vendorDoc.food = {
        items: b.foodItems,
        photoPaths: foodPhotoPaths,
        needPower: String(b.needPowerFood).toLowerCase() === "yes" || b.needPowerFood === true,
        watts: numOnly(b.foodWatts),
      };
    } else if (b.category === "Clothing Vendor") {
      vendorDoc.clothing = {
        clothingType: b.clothingType,
        photoPaths: clothingPhotoPaths,
      };
    } else if (b.category === "Jewelry Vendor") {
      vendorDoc.jewelry = {
        jewelryType: b.jewelryType,
        photoPaths: jewelryPhotoPaths,
      };
    } else if (b.category === "Craft Booth") {
      vendorDoc.craft = {
        details: b.craftDetails,
        photoPaths: craftPhotoPaths,
        needPower: String(b.needPowerCraft).toLowerCase() === "yes" || b.needPowerCraft === true,
        watts: numOnly(b.craftWatts),
      };
    }

    // Create Vendor (unique index blocks double booking)
    let vendor;
    try {
      [vendor] = await Vendor.create([vendorDoc], { session });
    } catch (e) {
      // duplicate key => booth already active for same event
      if (e?.code === 11000) {
        await session.abortTransaction();
        return res.status(409).json({
          error: "Booth not available. It may be booked or held by another vendor.",
        });
      }
      throw e;
    }

    await session.commitTransaction();

    const emailData = {
      vendorId: vendor._id,
      vendorName: vendor.vendorName,
      personName: vendor.contact.personName,
      email: vendor.contact.email,
      phone: vendor.contact.phone,
      category: vendor.category,
      boothNumber: vendor.boothNumber,
      isOakville: vendor.contact.isOakville,
      selectedEvent: vendor.selectedEvent,
      pricing: vendor.pricing,
      instagram: vendor.socials?.instagram,
      facebook: vendor.socials?.facebook,
      notes: vendor.notes,
      submittedAt: new Date().toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    if (vendor.food) {
      emailData.foodItems = vendor.food.items;
      emailData.needPower = vendor.food.needPower;
      emailData.watts = vendor.food.watts;
    }
    if (vendor.clothing) {
      emailData.clothingType = vendor.clothing.clothingType;
    }
    if (vendor.jewelry) {
      emailData.jewelryType = vendor.jewelry.jewelryType;
    }
    if (vendor.craft) {
      emailData.craftDetails = vendor.craft.details;
      emailData.needPower = vendor.craft.needPower;
      emailData.watts = vendor.craft.watts;
    }

    try {
      await sendVendorSubmissionEmails(emailData);
      console.log("✅ Email notifications sent successfully");
    } catch (emailError) {
      console.error("⚠️ Email notification failed (non-critical):", emailError.message);
    }

    return res.status(201).json({
      success: true,
      message:
        "Thank you for applying! We've sent the next steps to your email. Your booth is reserved for the next 48 hours. Please complete the steps in the email to confirm your booking.",
      vendor: {
        id: vendor._id,
        vendorName: vendor.vendorName,
        category: vendor.category,
        boothNumber: vendor.boothNumber,
        status: vendor.status,
        heldUntil: heldUntil.toISOString(),
        pricing: vendor.pricing,
        businessLogoPath: vendor.businessLogoPath,
        photoPaths: {
          food: vendor.food?.photoPaths || [],
          clothing: vendor.clothing?.photoPaths || [],
          jewelry: vendor.jewelry?.photoPaths || [],
          craft: vendor.craft?.photoPaths || [],
        },
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Create vendor failed:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        error: "Booth not available. It may be booked or held by another vendor.",
      });
    }

    return res.status(500).json({
      error: "Failed to create vendor",
      message: error.message,
    });
  } finally {
    session.endSession();
  }
}

export async function getVendor(req, res) {
  const i = await Vendor.findById(req.params.id); // fixed
  if (!i) return res.status(404).json({ error: "Not found" });
  res.json(normalizeVendor(i));
}

export async function updateVendor(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const vendorId = req.params.id;
    const updates = req.body || {};

    const vendor = await Vendor.findById(vendorId).session(session);
    if (!vendor) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Vendor not found" });
    }

    // If admin changes boothNumber/category, validate against catalog and prevent price tampering
    if (updates.boothNumber || updates.category) {
      const boothNumberToCheck = updates.boothNumber ?? vendor.boothNumber;
      const categoryToCheck = updates.category ?? vendor.category;

      const boothMeta = getBoothMeta(boothNumberToCheck, categoryToCheck);
      if (!boothMeta) {
        await session.abortTransaction();
        return res.status(400).json({ error: "Invalid boothNumber (not in fixed booth list)" });
      }
      if (boothMeta.error === "CATEGORY_NOT_SUPPORTED") {
        await session.abortTransaction();
        return res.status(400).json({ error: "Category not supported for booth booking" });
      }
      if (boothMeta.error === "CATEGORY_MISMATCH") {
        await session.abortTransaction();
        return res.status(400).json({ error: "Booth category mismatch" });
      }

      updates.boothNumber = boothMeta.boothNumber;
      updates.boothPrice = boothMeta.boothPrice;
      updates.boothTableCategory = boothMeta.boothTableCategory;
    }

    const updatedVendor = await Vendor.findByIdAndUpdate(
      vendorId,
      { $set: updates },
      { new: true, session }
    );

    await session.commitTransaction();
    res.json(normalizeVendor(updatedVendor));
  } catch (error) {
    await session.abortTransaction();
    console.error("Update vendor failed:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        error: "Booth not available. It may be booked or held by another vendor.",
      });
    }

    res.status(500).json({
      error: "Failed to update vendor",
      message: error.message,
    });
  } finally {
    session.endSession();
  }
}

export async function removeVendor(req, res) {
  const d = await Vendor.findByIdAndDelete(req.params.id);
  if (!d) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
}

export async function allstats(req, res) {
  try {
    const totalVendors = await Vendor.countDocuments();
    const approvedVendors = await Vendor.countDocuments({ status: "approved" });
    const submittedVendors = await Vendor.countDocuments({ status: "submitted" });
    const heldVendors = await Vendor.countDocuments({ status: "held" });
    const confirmedVendors = await Vendor.countDocuments({ status: "confirmed" });
    const expiredVendors = await Vendor.countDocuments({ status: "expired" });
    const rejectedVendors = await Vendor.countDocuments({ status: "rejected" });

    const categoryBreakdown = await Vendor.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const totalSponsors = await Sponsor.countDocuments();
    const sponsorsByTier = await Sponsor.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    // Booth stats are derived from TABLES + vendor statuses
    const totalBooths = TABLES.length;

    const activeBoothNumbers = await Vendor.distinct("boothNumber", {
      status: { $in: ["held", "confirmed", "under_review", "approved", "paid"] },
    });

    const heldBooths = await Vendor.distinct("boothNumber", { status: "held" });
    const confirmedBooths = await Vendor.distinct("boothNumber", { status: { $in: ["confirmed", "paid"] } });
    const bookedBooths = await Vendor.distinct("boothNumber", { status: { $in: ["under_review", "approved"] } });

    const availableBooths = Math.max(0, totalBooths - activeBoothNumbers.length);

    const totalParticipants = await Participant.countDocuments();
    const participantsByCategory = await Participant.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const stats = {
      vendors: {
        total: totalVendors,
        approved: approvedVendors,
        submitted: submittedVendors,
        held: heldVendors,
        confirmed: confirmedVendors,
        expired: expiredVendors,
        rejected: rejectedVendors,
        byCategory: categoryBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
      sponsors: {
        total: totalSponsors,
        byTier: sponsorsByTier.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
      booths: {
        total: totalBooths,
        available: availableBooths,
        booked: bookedBooths.length,
        held: heldBooths.length,
        confirmed: confirmedBooths.length,
      },
      participants: {
        total: totalParticipants,
        byCategory: participantsByCategory.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error("Stats fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
}

function normalizeFilePath(absolutePath) {
  if (!absolutePath) return null;
  const filename = absolutePath.split(/[/\\]/).pop();
  return `${BASE_URL}/uploads/${filename}`;
}

function normalizeVendor(vendor) {
  if (!vendor) return vendor;

  const vendorObj = vendor.toObject ? vendor.toObject() : vendor;

  if (vendorObj.businessLogoPath) {
    vendorObj.businessLogoPath = normalizeFilePath(vendorObj.businessLogoPath);
  }

  if (vendorObj.food?.photoPaths?.length) {
    vendorObj.food.photoPaths = vendorObj.food.photoPaths.map(normalizeFilePath);
  }

  if (vendorObj.clothing?.photoPaths?.length) {
    vendorObj.clothing.photoPaths = vendorObj.clothing.photoPaths.map(normalizeFilePath);
  }

  if (vendorObj.jewelry?.photoPaths?.length) {
    vendorObj.jewelry.photoPaths = vendorObj.jewelry.photoPaths.map(normalizeFilePath);
  }

  if (vendorObj.craft?.photoPaths?.length) {
    vendorObj.craft.photoPaths = vendorObj.craft.photoPaths.map(normalizeFilePath);
  }

  return vendorObj;
}

const TABLE_CAT_TO_VENDOR_CAT = {
  food: "Food Vendor",
  clothing: "Clothing Vendor",
  jewelry: "Jewelry Vendor",
  craft: "Craft Booth",
};

function mapVendorStatusToBoothStatus(vendorStatus) {
  // Booth UI needs: available | held | booked | confirmed
  if (vendorStatus === "held") return "held";
  if (vendorStatus === "confirmed" || vendorStatus === "paid") return "confirmed";
  if (vendorStatus === "under_review" || vendorStatus === "approved") return "booked";
  return "available";
}

function boothPriority(boothStatus) {
  // higher = stronger lock
  if (boothStatus === "confirmed") return 3;
  if (boothStatus === "booked") return 2;
  if (boothStatus === "held") return 1;
  return 0;
}

export async function listBooths(req, res) {
  const { selectedEvent } = req.query;

  const activeVendorStatuses = ["held", "confirmed", "under_review", "approved", "paid"];

  const query = { status: { $in: activeVendorStatuses } };
  if (selectedEvent) query.selectedEvent = selectedEvent;

  const vendors = await Vendor.find(query)
    .select("_id vendorName boothNumber status bookingTimeline createdAt selectedEvent")
    .lean();

  const now = new Date();
  const lockByBooth = new Map();

  for (const v of vendors) {
    const boothNumber = String(v.boothNumber ?? "");
    if (!boothNumber) continue;

    if (v.status === "held") {
      const heldUntil = v.bookingTimeline?.heldUntil ? new Date(v.bookingTimeline.heldUntil) : null;
      if (heldUntil && heldUntil < now) continue;
    }

    const boothStatus = mapVendorStatusToBoothStatus(v.status);
    const pr = boothPriority(boothStatus);
    if (pr === 0) continue;

    const current = lockByBooth.get(boothNumber);
    const createdAt = v.createdAt ? new Date(v.createdAt) : new Date(0);

    if (!current || pr > current.pr || (pr === current.pr && createdAt > current.createdAt)) {
      lockByBooth.set(boothNumber, {
        pr,
        boothStatus,
        heldUntil: v.bookingTimeline?.heldUntil,
        heldBy: v._id,
        heldByName: v.vendorName,
        selectedEvent: v.selectedEvent,
        createdAt,
      });
    }
  }

  const result = TABLES.map((t) => {
    const lock = lockByBooth.get(String(t.id));

    return {
      id: t.id,
      category: TABLE_CAT_TO_VENDOR_CAT[t.category],
      price: t.price,
      status: lock?.boothStatus || "available",
      heldUntil: lock?.boothStatus === "held" ? lock.heldUntil : undefined,
      heldBy: lock?.heldBy || undefined,
      notes: undefined,
    };
  });

  return res.json(result);
}