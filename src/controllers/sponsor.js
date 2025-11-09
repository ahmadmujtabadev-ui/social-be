// ── src/controllers/sponsors.js ─────────────────────────────────────────────
import { Sponsor } from '../models/sponser.js'

export async function listSponsors(_req,res){ res.json(await Sponsor.find().sort({createdAt:-1})); }

export async function createSponsor(req, res) {
  try {
    const b = req.body;

    // normalize
    const map = {
      Platinum: "PLATINUM SPONSOR",
      Gold: "GOLD SPONSOR",
      Silver: "SILVER SPONSOR",
    };
    const category =
      map[b.category?.trim()] || b.category?.trim(); // allow both forms

    if (!b.businessName || !b.ownerName || !b.email || !b.phone || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const doc = {
      businessName: b.businessName,
      ownerName: b.ownerName,
      email: b.email,
      phone: b.phone,
      oneLiner: b.oneLiner,
      category, // normalized
      logoPath: req.file?.path,
      termsAcceptedAt: String(b.terms).toLowerCase() === "true" ? new Date() : undefined,
    };

    const created = await Sponsor.create(doc);
    return res.status(201).json(created);
  } catch (e) {
    // expose validation errors clearly
    if (e.name === "ValidationError") {
      return res.status(400).json({ error: e.message });
    }
    console.error("createSponsor error:", e);
    return res.status(500).json({ error: "Failed to create sponsor" });
  }
}



export async function getSponsor(req,res){ const i=await Sponsor.findById(req.params.id); if(!i) return res.status(404).json({error:'Not found'}); res.json(i); }
export async function updateSponsor(req,res){ const u=await Sponsor.findByIdAndUpdate(req.params.id,{ $set:req.body },{ new:true }); if(!u) return res.status(404).json({error:'Not found'}); res.json(u); }
export async function removeSponsor(req,res){ const d=await Sponsor.findByIdAndDelete(req.params.id); if(!d) return res.status(404).json({error:'Not found'}); res.json({ ok:true }); }