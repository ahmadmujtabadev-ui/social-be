import { Booth } from "../models/booth.js";
import { Promo } from "../models/promoCode.js";
import { Vendor } from "../models/vendor.js";
import { sendVendorSubmissionEmails } from "../utils/sendEmailNotification.js";

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

// export async function createVendor(req, res) {
//   try {
//     const b = req.body || {};
//     console.log("booth number", b.boothNumber)
//     const filesGrouped = groupFiles(req.files);

//     const missing = [];
//     if (!b.personName) missing.push('personName');
//     if (!b.vendorName) missing.push('vendorName');
//     if (!b.email) missing.push('email');
//     if (!b.phone) missing.push('phone');
//     if (b.isOakville === undefined || b.isOakville === '') missing.push('isOakville');
//     if (!b.category) missing.push('category');
//     if (!b.boothNumber) missing.push('boothNumber');
//     if (b.category === 'Food Vendor' && !b.foodItems) missing.push('foodItems');
//     if (b.category === 'Clothing Vendor' && !b.clothingType) missing.push('clothingType');
//     if (b.category === 'Jewelry Vendor' && !b.jewelryType) missing.push('jewelryType');
//     if (b.category === 'Craft Booth' && !b.craftDetails) missing.push('craftDetails');

//     if (missing.length) {
//       console.log('Missing fields:', missing);
//       return res.status(400).json({
//         error: 'Missing required fields',
//         missing,
//         received: Object.keys(b)
//       });
//     }

//     const boothNumber = Number(b.boothNumber);
//     if (Number.isNaN(boothNumber)) {
//       return res.status(400).json({ error: "Invalid boothNumber" });
//     }

//     console.log('Looking for booth:', { id: boothNumber, category: b.category });

//     const booth = await Booth.findOne({
//       id: boothNumber,
//       category: b.category
//     });

//     console.log('Found booth:', booth);

//     if (!booth) {
//       return res.status(400).json({ error: "Booth not found or category mismatch" });
//     }

//     if (booth.status === "booked") {
//       return res.status(409).json({ error: "Booth already booked" });
//     }

//     const updatedBooth = await Booth.findOneAndUpdate(
//       { id: boothNumber, category: b.category, status: { $ne: 'booked' } },
//       { $set: { status: "booked" } },
//       { new: true }
//     );

//     if (!updatedBooth) {
//       return res.status(409).json({ error: "Booth could not be booked" });
//     }

//     console.log('Booth updated:', updatedBooth);


//     let promoCode, promoDiscount, promoDiscountType;
//     const incomingPromo = (b.promoCode || '').toString().trim();
//     if (incomingPromo) {
//       const promo = await Promo.findOne({
//         code: incomingPromo.toUpperCase(),
//         active: true
//       });

//       if (promo) {
//         const now = new Date();

//         if (promo.startsAt && now < new Date(promo.startsAt)) {
//           return res.status(400).json({
//             error: "Promo code not yet active",
//             startsAt: promo.startsAt
//           });
//         }

//         if (promo.endsAt && now > new Date(promo.endsAt)) {
//           return res.status(400).json({
//             error: "Promo code has expired",
//             endedAt: promo.endsAt
//           });
//         }

//         promoCode = promo.code;
//         promoDiscount = promo.discount;
//         promoDiscountType = promo.discountType || 'percent';
//       } else {
//         return res.status(400).json({ error: "Invalid promo code" });
//       }
//     }

//     const logoPath = filesGrouped.businessLogo?.[0]?.path;
//     const foodPhotoPaths = (filesGrouped.foodPhotos || []).map(f => f.path);
//     const clothingPhotoPaths = (filesGrouped.clothingPhotos || []).map(f => f.path);
//     const jewelryPhotoPaths = (filesGrouped.jewelryPhotos || []).map(f => f.path);
//     const craftPhotoPaths = (filesGrouped.craftPhotos || []).map(f => f.path);

//     const baseAmount = numOnly(b.amountToPay) || 0;

//     let finalAmount = baseAmount;
//     if (promoDiscount) {
//       if (promoDiscountType === 'flat') {
//         finalAmount = Math.max(0, baseAmount - promoDiscount);
//       } else {
//         finalAmount = Math.max(0, baseAmount - (baseAmount * promoDiscount / 100));
//       }
//     }

//     const vendorDoc = {
//       vendorName: b.vendorName,
//       contact: {
//         personName: b.personName,
//         email: b.email,
//         phone: b.phone,
//         isOakville: String(b.isOakville).toLowerCase() === 'yes' || b.isOakville === true
//       },
//       socials: {
//         instagram: b.instagram || undefined,
//         facebook: b.facebook || undefined
//       },
//       category: b.category,
//       businessLogoPath: logoPath,
//       boothNumber: b.boothNumber.id,
//       pricing: {
//         base: baseAmount,
//         promoCode,
//         promoDiscount,
//         promoDiscountType,
//         final: finalAmount
//       },
//       notes: b.notes,
//       termsAcceptedAt: (String(b.terms).toLowerCase() === 'true' || b.terms === true) ? new Date() : undefined,
//       status: 'submitted'
//     };

//     if (b.category === 'Food Vendor') {
//       vendorDoc.food = {
//         items: b.foodItems,
//         photoPaths: foodPhotoPaths,
//         needPower: String(b.needPowerFood).toLowerCase() === 'yes' || b.needPowerFood === true,
//         watts: numOnly(b.foodWatts)
//       };
//     }

//     if (b.category === 'Clothing Vendor') {
//       vendorDoc.clothing = {
//         clothingType: b.clothingType,
//         photoPaths: clothingPhotoPaths
//       };
//     }

//     if (b.category === 'Jewelry Vendor') {
//       vendorDoc.jewelry = {
//         jewelryType: b.jewelryType,
//         photoPaths: jewelryPhotoPaths
//       };
//     }

//     if (b.category === 'Craft Booth') {
//       vendorDoc.craft = {
//         details: b.craftDetails,
//         photoPaths: craftPhotoPaths,
//         needPower: String(b.needPowerCraft).toLowerCase() === 'yes' || b.needPowerCraft === true,
//         watts: numOnly(b.craftWatts)
//       };
//     }

//     console.log('Vendor document to create:', vendorDoc);

//     const vendor = await Vendor.create(vendorDoc);

//     console.log('Vendor created:', vendor._id);

//     return res.status(201).json({
//       success: true,
//       message: 'Vendor application submitted successfully',
//       vendor: {
//         id: vendor._id,
//         vendorName: vendor.vendorName,
//         category: vendor.category,
//         boothNumber: vendor.boothNumber,
//         status: vendor.status,
//         pricing: vendor.pricing
//       }
//     });

//   } catch (error) {
//     console.error('Create vendor failed:', error);

//     return res.status(500).json({
//       error: 'Failed to create vendor',
//       message: error.message
//     });
//   }
// }

export async function createVendor(req, res) {
  try {
    const b = req.body || {};
    console.log('📝 Vendor submission received');
    console.log('Booth number:', b.boothNumber);
    
    const filesGrouped = groupFiles(req.files);

    // Validate required fields
    const missing = [];
    if (!b.personName) missing.push('personName');
    if (!b.vendorName) missing.push('vendorName');
    if (!b.email) missing.push('email');
    if (!b.phone) missing.push('phone');
    if (b.isOakville === undefined || b.isOakville === '') missing.push('isOakville');
    if (!b.selectedEvent) missing.push('selectedEvent');
    if (!b.category) missing.push('category');
    if (!b.boothNumber) missing.push('boothNumber');
    
    // Category-specific validation
    if (b.category === 'Food Vendor' && !b.foodItems) missing.push('foodItems');
    if (b.category === 'Clothing Vendor' && !b.clothingType) missing.push('clothingType');
    if (b.category === 'Jewelry Vendor' && !b.jewelryType) missing.push('jewelryType');
    if (b.category === 'Craft Booth' && !b.craftDetails) missing.push('craftDetails');

    if (missing.length) {
      console.log('❌ Missing required fields:', missing);
      return res.status(400).json({
        error: 'Missing required fields',
        missing,
        received: Object.keys(b)
      });
    }

    // Validate and fetch booth
    const boothNumber = Number(b.boothNumber);
    if (Number.isNaN(boothNumber)) {
      return res.status(400).json({ error: "Invalid boothNumber" });
    }

    console.log('🔍 Looking for booth:', { id: boothNumber, category: b.category });

    const booth = await Booth.findOne({
      id: boothNumber,
      category: b.category
    });

    console.log('Found booth:', booth ? `✓ Booth #${booth.id}` : '✗ Not found');

    if (!booth) {
      return res.status(400).json({ 
        error: "Booth not found or category mismatch",
        details: `No booth #${boothNumber} found for category "${b.category}"` 
      });
    }

    if (booth.status === "booked") {
      return res.status(409).json({ 
        error: "Booth already booked",
        details: `Booth #${boothNumber} is currently unavailable. Please select a different booth.`
      });
    }

    // Atomically update booth status
    const updatedBooth = await Booth.findOneAndUpdate(
      { id: boothNumber, category: b.category, status: { $ne: 'booked' } },
      { 
        $set: { 
          status: "booked",
          bookedAt: new Date()
        } 
      },
      { new: true }
    );

    if (!updatedBooth) {
      return res.status(409).json({ 
        error: "Booth could not be booked",
        details: "This booth may have been booked by another vendor. Please try a different booth."
      });
    }

    console.log('✅ Booth updated:', `#${updatedBooth.id} - Status: ${updatedBooth.status}`);

    // Handle promo code validation
    let promoCode, promoDiscount, promoDiscountType;
    const incomingPromo = (b.promoCode || '').toString().trim();
    
    if (incomingPromo) {
      const promo = await Promo.findOne({
        code: incomingPromo.toUpperCase(),
        active: true
      });

      if (promo) {
        const now = new Date();

        // Check if promo is active
        if (promo.startsAt && now < new Date(promo.startsAt)) {
          return res.status(400).json({
            error: "Promo code not yet active",
            startsAt: promo.startsAt
          });
        }

        if (promo.endsAt && now > new Date(promo.endsAt)) {
          return res.status(400).json({
            error: "Promo code has expired",
            endedAt: promo.endsAt
          });
        }

        promoCode = promo.code;
        promoDiscount = promo.discount;
        promoDiscountType = promo.discountType || 'percent';
        
        console.log('🎟️ Promo code applied:', promoCode, `-${promoDiscount}${promoDiscountType === 'percent' ? '%' : '$'}`);
      } else {
        return res.status(400).json({ error: "Invalid promo code" });
      }
    }

    // Process file uploads
    const logoPath = filesGrouped.businessLogo?.[0]?.path;
    const foodPhotoPaths = (filesGrouped.foodPhotos || []).map(f => f.path);
    const clothingPhotoPaths = (filesGrouped.clothingPhotos || []).map(f => f.path);
    const jewelryPhotoPaths = (filesGrouped.jewelryPhotos || []).map(f => f.path);
    const craftPhotoPaths = (filesGrouped.craftPhotos || []).map(f => f.path);

    console.log('📸 Files uploaded:', {
      logo: logoPath ? '✓' : '✗',
      foodPhotos: foodPhotoPaths.length,
      clothingPhotos: clothingPhotoPaths.length,
      jewelryPhotos: jewelryPhotoPaths.length,
      craftPhotos: craftPhotoPaths.length,
    });

    // Calculate pricing
    const baseAmount = numOnly(b.amountToPay) || 0;
    let finalAmount = baseAmount;
    
    if (promoDiscount) {
      if (promoDiscountType === 'flat') {
        finalAmount = Math.max(0, baseAmount - promoDiscount);
      } else {
        finalAmount = Math.max(0, baseAmount - (baseAmount * promoDiscount / 100));
      }
    }

    console.log('💰 Pricing:', {
      base: `$${baseAmount.toFixed(2)}`,
      discount: promoDiscount ? `-$${(baseAmount - finalAmount).toFixed(2)}` : 'None',
      final: `$${finalAmount.toFixed(2)}`
    });

    // Build vendor document
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
      selectedEvent: b.selectedEvent,
      businessLogoPath: logoPath,
      boothNumber: boothNumber,
      pricing: {
        base: baseAmount,
        promoCode,
        promoDiscount,
        promoDiscountType,
        final: finalAmount
      },
      notes: b.notes || '',
      termsAcceptedAt: (String(b.terms).toLowerCase() === 'true' || b.terms === true) ? new Date() : undefined,
      status: 'submitted'
    };

    // Add category-specific fields
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

    console.log('📄 Creating vendor document...');

    // Create vendor in database
    const vendor = await Vendor.create(vendorDoc);

    console.log('✅ Vendor created successfully:', vendor._id);

    // Prepare email data
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
      submittedAt: new Date().toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
    };

    // Add category-specific data for email
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

    // Send email notifications (admin + vendor confirmation)
    console.log('📧 Sending email notifications...');
    
    try {
      await sendVendorSubmissionEmails(emailData);
      console.log('✅ Email notifications sent successfully');
    } catch (emailError) {
      console.error('⚠️ Email notification failed (non-critical):', emailError.message);
      // Don't fail the request if email fails
    }

    // Return success response
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
    console.error('❌ Create vendor failed:', error);

    // Rollback booth status if vendor creation failed
    if (req.body?.boothNumber) {
      try {
        await Booth.findOneAndUpdate(
          { id: Number(req.body.boothNumber) },
          { $set: { status: "available" } }
        );
        console.log('♻️ Booth status rolled back to available');
      } catch (rollbackError) {
        console.error('⚠️ Failed to rollback booth status:', rollbackError);
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

