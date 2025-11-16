// ── src/controllers/booths.js ───────────────────────────────────────────────
import { Booth } from '../models/booth.js';

export async function listBooths(_req,res){ res.json(await Booth.find().sort({ id:1 })); }
// Add to src/controllers/booths.js
export async function createMultipleBooths(req, res) {
  try {
    const { booths } = req.body;
    if (!Array.isArray(booths)) {
      return res.status(400).json({ error: 'booths must be an array' });
    }
    const created = await Booth.insertMany(booths);
    res.status(201).json({ success: true, count: created.length, booths: created });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}
export async function getBooth(req,res){ const i=await Booth.findById(req.params.id); if(!i) return res.status(404).json({error:'Not found'}); res.json(i); }
export async function updateBooth(req,res){ const u=await Booth.findByIdAndUpdate(req.params.id,{ $set:req.body },{ new:true }); if(!u) return res.status(404).json({error:'Not found'}); res.json(u); }
export async function removeBooth(req,res){ const d=await Booth.findByIdAndDelete(req.params.id); if(!d) return res.status(404).json({error:'Not found'}); res.json({ ok:true }); }