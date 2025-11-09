import { Booth } from "../models/booth.js";
import { Promo } from "../models/promoCode.js";
import { Vendor } from "../models/vendor.js";

// ── src/controllers/vendors.js ──────────────────────────────────────────────
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

// --- Create Vendor ---
export async function createVendor(req, res) {
  try {
    const b = req.body || {};
    const filesGrouped = groupFiles(req.files);

    // DEBUG: Log incoming data
    console.log('=== INCOMING REQUEST ===');
    console.log('Body:', b);
    console.log('Files:', req.files);
    console.log('========================');

    // 1) Validate required fields
    const missing = [];
    if (!b.personName) missing.push('personName');
    if (!b.vendorName) missing.push('vendorName');
    if (!b.email) missing.push('email');
    if (!b.phone) missing.push('phone');
    if (b.isOakville === undefined || b.isOakville === '') missing.push('isOakville');
    if (!b.category) missing.push('category');
    if (!b.boothNumber) missing.push('boothNumber');

    // Category-specific validation
    if (b.category === 'Food Vendor' && !b.foodItems) missing.push('foodItems');
    if (b.category === 'Clothing Vendor' && !b.clothingType) missing.push('clothingType');
    if (b.category === 'Jewelry Vendor' && !b.jewelryType) missing.push('jewelryType');
    if (b.category === 'Craft Booth' && !b.craftDetails) missing.push('craftDetails');

    if (missing.length) {
      console.log('Missing fields:', missing);
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missing,
        received: Object.keys(b)
      });
    }

    // 2) Find and verify booth
    const boothNumber = Number(b.boothNumber);
    if (Number.isNaN(boothNumber)) {
      return res.status(400).json({ error: "Invalid boothNumber" });
    }

    console.log('Looking for booth:', { id: boothNumber, category: b.category });

    const booth = await Booth.findOne({ 
      id: boothNumber, 
      category: b.category 
    });

    console.log('Found booth:', booth);

    if (!booth) {
      return res.status(400).json({ error: "Booth not found or category mismatch" });
    }

    if (booth.status === "booked") {
      return res.status(409).json({ error: "Booth already booked" });
    }

    // 3) Update booth to booked
    const updatedBooth = await Booth.findOneAndUpdate(
      { id: boothNumber, category: b.category, status: { $ne: 'booked' } },
      { $set: { status: "booked" } },
      { new: true }
    );

    if (!updatedBooth) {
      return res.status(409).json({ error: "Booth could not be booked" });
    }

    console.log('Booth updated:', updatedBooth);

    // 4) Handle promo code
    let promoCode, promoDiscount;
    const incomingPromo = (b.promoCode || '').toString().trim();
    if (incomingPromo) {
      const promo = await Promo.findOne({ 
        code: incomingPromo.toUpperCase(), 
        active: true 
      });
      if (promo) {
        promoCode = promo.code;
        promoDiscount = promo.discount;
      }
    }

    // 5) Handle file uploads
    const logoPath = filesGrouped.businessLogo?.[0]?.path;
    const foodPhotoPaths = (filesGrouped.foodPhotos || []).map(f => f.path);
    const clothingPhotoPaths = (filesGrouped.clothingPhotos || []).map(f => f.path);
    const jewelryPhotoPaths = (filesGrouped.jewelryPhotos || []).map(f => f.path);
    const craftPhotoPaths = (filesGrouped.craftPhotos || []).map(f => f.path);

    // 6) Calculate pricing
    const base = numOnly(b.amountToPay) ?? updatedBooth.price ?? 0;
    const final = promoDiscount ? Math.max(0, base - (base * promoDiscount / 100)) : base;

    // 7) Build vendor document
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
      boothNumber: String(boothNumber),
      boothRef: updatedBooth._id,
      pricing: { 
        base, 
        promoCode, 
        promoDiscount, 
        final 
      },
      notes: b.notes,
      termsAcceptedAt: (String(b.terms).toLowerCase() === 'true' || b.terms === true) ? new Date() : undefined,
      status: 'submitted'
    };

    // 8) Add category-specific data
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

    console.log('Vendor document to create:', vendorDoc);

    // 9) Create vendor
    const vendor = await Vendor.create(vendorDoc);

    console.log('Vendor created:', vendor._id);

    // 10) Return success
    return res.status(201).json({
      success: true,
      message: 'Vendor application submitted successfully',
      vendor: {
        id: vendor._id,
        vendorName: vendor.vendorName,
        category: vendor.category,
        boothNumber: vendor.boothNumber,
        status: vendor.status,
        pricing: vendor.pricing
      }
    });

  } catch (error) {
    console.error('Create vendor failed:', error);
    
    // Rollback booth if vendor creation failed
    if (req.body.boothNumber) {
      try {
        await Booth.findOneAndUpdate(
          { id: Number(req.body.boothNumber) },
          { $set: { status: "available" } }
        );
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    }
    
    return res.status(500).json({ 
      error: 'Failed to create vendor',
      message: error.message 
    });
  }
}

export async function getVendor(req, res) {
  const i = await Vendor.find(req.params.id).populate('boothRef');
  if (!i) return res.status(404).json({ error: 'Not found' });
  res.json(i);
}

export async function updateVendor(req, res) { const u = await Vendor.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }); if (!u) return res.status(404).json({ error: 'Not found' }); res.json(u); }
export async function removeVendor(req, res) { const d = await Vendor.findByIdAndDelete(req.params.id); if (!d) return res.status(404).json({ error: 'Not found' }); res.json({ ok: true }); }

