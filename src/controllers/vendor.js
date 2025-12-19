import mongoose from "mongoose";
import { Booth } from "../models/booth.js";
import { Promo } from "../models/promoCode.js";
import { Vendor } from "../models/vendor.js";

// ── src/controllers/vendors.js ──────────────────────────────────────────────

import cron from 'node-cron';

export function setupExpiryCleanupJob() {
  cron.schedule('*/15 * * * *', async () => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await releaseExpiredHolds(session);
      await session.commitTransaction();
      console.log('✅ Expired holds cleaned up');
    } catch (error) {
      await session.abortTransaction();
      console.error('❌ Failed to clean expired holds:', error);
    } finally {
      session.endSession();
    }
  });
}

setupExpiryCleanupJob();

const numOnly = (v) => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(String(v).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
};

// // normalize files that may arrive as fieldname, fieldname[], or fieldname[0]
// function groupFiles(files) {
//   const map = {};
//   (files || []).forEach(f => {
//     const key = (f.fieldname || '').replace(/\[\d*\]$/, ''); // strip [0], [], [12]
//     if (!map[key]) map[key] = [];
//     map[key].push(f);
//   });
//   return map;
// }
export async function getStats(req, res) {
  const [total, submitted, approved] = await Promise.all([
    Vendor.countDocuments(),
    Vendor.countDocuments({ status: 'submitted' }),
    Vendor.countDocuments({ status: 'approved' })
  ]);
  res.json({ total, submitted, approved });
}

export async function listVendors(req, res) {
  const { q, status, category, page = '1', limit = '20' } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (q) { filter.$or = [{ vendorName: { $regex: q, $options: 'i' } }, { 'contact.personName': { $regex: q, $options: 'i' } }]; }
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Vendor.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Vendor.countDocuments(filter)
  ]);
  res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
}

function groupFiles(files) {
  if (!files) return {};
  if (!Array.isArray(files) && typeof files === "object") {
    return files;
  }
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


async function releaseExpiredHolds(session) {
  const now = new Date();

  const expiredBooths = await Booth.find({
    status: 'held',
    heldUntil: { $lt: now }
  }).session(session);

  if (expiredBooths.length > 0) {
    // Release booths
    await Booth.updateMany(
      {
        status: 'held',
        heldUntil: { $lt: now }
      },
      {
        $set: { status: 'available' },
        $unset: { heldBy: '', heldUntil: '' }
      },
      { session }
    );

    // Mark vendors as expired
    const expiredVendorIds = expiredBooths.map(b => b.heldBy).filter(Boolean);
    if (expiredVendorIds.length > 0) {
      await Vendor.updateMany(
        {
          _id: { $in: expiredVendorIds },
          status: 'held'
        },
        {
          $set: { status: 'expired' }
        },
        { session }
      );
    }
  }
}

export async function createVendor(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const b = req.body || {};
    const filesGrouped = groupFiles(req.files);

    const missing = [];
    if (!b.personName) missing.push('personName');
    if (!b.vendorName) missing.push('vendorName');
    if (!b.email) missing.push('email');
    if (!b.phone) missing.push('phone');
    if (b.isOakville === undefined || b.isOakville === '') missing.push('isOakville');
    if (!b.category) missing.push('category');
    if (!b.boothNumber) missing.push('boothNumber');
    if (b.category === 'Food Vendor' && !b.foodItems) missing.push('foodItems');
    if (b.category === 'Clothing Vendor' && !b.clothingType) missing.push('clothingType');
    if (b.category === 'Jewelry Vendor' && !b.jewelryType) missing.push('jewelryType');
    if (b.category === 'Craft Booth' && !b.craftDetails) missing.push('craftDetails');

    if (missing.length) {
      await session.abortTransaction();
      return res.status(400).json({
        error: 'Missing required fields',
        missing,
        received: Object.keys(b)
      });
    }

    const boothNumber = Number(b.boothNumber);
    if (Number.isNaN(boothNumber)) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Invalid boothNumber" });
    }

    await releaseExpiredHolds(session);

    // const booth = await Booth.findOneAndUpdate(
    //   {
    //     id: boothNumber,
    //     category: b.category,
    //     status: 'available' // Only book if truly available
    //   },
    //   {
    //     $set: {
    //       status: 'held',
    //       heldUntil: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours from now
    //     }
    //   },
    //   {
    //     new: true,
    //     session // Use transaction
    //   }
    // );
    const HOLD_MS = 48 * 60 * 60 * 1000 // 5000 ms

    // In createVendor -> Booth.findOneAndUpdate
    const booth = await Booth.findOneAndUpdate(
      {
        id: boothNumber,
        category: b.category,
        status: 'available' // Only book if truly available
      },
      {
        $set: {
          status: 'held',
          heldUntil: new Date(Date.now() + HOLD_MS) // 5 seconds from now
        }
      },
      {
        new: true,
        session
      }
    );

    if (!booth) {
      await session.abortTransaction();
      return res.status(409).json({
        error: "Booth not available. It may be booked or held by another vendor."
      });
    }

    let promoCode, promoDiscount, promoDiscountType;
    const incomingPromo = (b.promoCode || '').toString().trim();
    if (incomingPromo) {
      const promo = await Promo.findOne({
        code: incomingPromo.toUpperCase(),
        active: true
      }).session(session);

      if (promo) {
        const now = new Date();
        if (promo.startsAt && now < new Date(promo.startsAt)) {
          await session.abortTransaction();
          return res.status(400).json({
            error: "Promo code not yet active",
            startsAt: promo.startsAt
          });
        }
        if (promo.endsAt && now > new Date(promo.endsAt)) {
          await session.abortTransaction();
          return res.status(400).json({
            error: "Promo code has expired",
            endedAt: promo.endsAt
          });
        }
        promoCode = promo.code;
        promoDiscount = promo.discount;
        promoDiscountType = promo.discountType || 'percent';
      } else {
        await session.abortTransaction();
        return res.status(400).json({ error: "Invalid promo code" });
      }
    }

    const logoPath = filesGrouped.businessLogo?.[0]?.path;
    const foodPhotoPaths = (filesGrouped.foodPhotos || []).map(f => f.path);
    const clothingPhotoPaths = (filesGrouped.clothingPhotos || []).map(f => f.path);
    const jewelryPhotoPaths = (filesGrouped.jewelryPhotos || []).map(f => f.path);
    const craftPhotoPaths = (filesGrouped.craftPhotos || []).map(f => f.path);

    const baseAmount = numOnly(b.amountToPay) || 0;
    let finalAmount = baseAmount;
    if (promoDiscount) {
      if (promoDiscountType === 'flat') {
        finalAmount = Math.max(0, baseAmount - promoDiscount);
      } else {
        finalAmount = Math.max(0, baseAmount - (baseAmount * promoDiscount / 100));
      }
    }

    const now = new Date();
    const heldUntil = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // And for vendor bookingTimeline
    // const now = new Date();
    // const heldUntil = new Date(now.getTime() + HOLD_MS);

    const vendorDoc = {
      vendorName: b.vendorName,
      contact: {
        personName: b.personName,
        email: b.email,
        phone: b.phone,
        isOakville: String(b.isOakville).toLowerCase() === 'yes' || b.isOakville === true
      },
      socials: {
        instagram: b.instagram || undefined,
        facebook: b.facebook || undefined
      },
      category: b.category,
      businessLogoPath: logoPath,
      boothNumber: booth.id.toString(),
      boothRef: booth._id,
      pricing: {
        base: baseAmount,
        promoCode,
        promoDiscount,
        promoDiscountType,
        final: finalAmount
      },
      bookingTimeline: {
        submittedAt: now,
        heldUntil: heldUntil
      },
      notes: b.notes,
      termsAcceptedAt: (String(b.terms).toLowerCase() === 'true' || b.terms === true) ? now : undefined,
      status: 'held'
    };

    if (b.category === 'Food Vendor') {
      vendorDoc.food = {
        items: b.foodItems,
        photoPaths: foodPhotoPaths,
        needPower: String(b.needPowerFood).toLowerCase() === 'yes' || b.needPowerFood === true,
        watts: numOnly(b.foodWatts)
      };
    }
    if (b.category === 'Clothing Vendor') {
      vendorDoc.clothing = {
        clothingType: b.clothingType,
        photoPaths: clothingPhotoPaths
      };
    }
    if (b.category === 'Jewelry Vendor') {
      vendorDoc.jewelry = {
        jewelryType: b.jewelryType,
        photoPaths: jewelryPhotoPaths
      };
    }
    if (b.category === 'Craft Booth') {
      vendorDoc.craft = {
        details: b.craftDetails,
        photoPaths: craftPhotoPaths,
        needPower: String(b.needPowerCraft).toLowerCase() === 'yes' || b.needPowerCraft === true,
        watts: numOnly(b.craftWatts)
      };
    }

    const [vendor] = await Vendor.create([vendorDoc], { session });

    // Update booth to reference the vendor
    await Booth.findByIdAndUpdate(
      booth._id,
      { $set: { heldBy: vendor._id } },
      { session }
    );

    // Commit transaction
    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Thank you for applying! We've sent the next steps to your email. Your booth is reserved for the next 48 hours. Please complete the steps in the email to confirm your booking.",
      vendor: {
        id: vendor._id,
        vendorName: vendor.vendorName,
        category: vendor.category,
        boothNumber: vendor.boothNumber,
        status: vendor.status,
        heldUntil: heldUntil.toISOString(),
        pricing: vendor.pricing
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Create vendor failed:', error);
    return res.status(500).json({
      error: 'Failed to create vendor',
      message: error.message
    });
  } finally {
    session.endSession();
  }
}


export async function getVendor(req, res) {
  const i = await Vendor.find(req.params.id).populate('boothRef');
  if (!i) return res.status(404).json({ error: 'Not found' });
  res.json(i);
}

export async function updateVendor(req, res) { const u = await Vendor.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }); if (!u) return res.status(404).json({ error: 'Not found' }); res.json(u); }
export async function removeVendor(req, res) { const d = await Vendor.findByIdAndDelete(req.params.id); if (!d) return res.status(404).json({ error: 'Not found' }); res.json({ ok: true }); }

