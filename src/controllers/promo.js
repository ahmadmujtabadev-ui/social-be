// ── src/controllers/promos.js ───────────────────────────────────────────────
import { Promo } from "../models/promoCode";

export async function listPromos(_req,res){ res.json(await Promo.find().sort({ createdAt:-1 })); }
export async function createPromo(req,res){ try{ const p=await Promo.create(req.body); res.status(201).json(p);}catch(e){ res.status(400).json({error:'Invalid promo'});} }
export async function getPromo(req,res){ const i=await Promo.findById(req.params.id); if(!i) return res.status(404).json({error:'Not found'}); res.json(i); }
export async function updatePromo(req,res){ const u=await Promo.findByIdAndUpdate(req.params.id,{ $set:req.body },{ new:true }); if(!u) return res.status(404).json({error:'Not found'}); res.json(u); }
export async function removePromo(req,res){ const d=await Promo.findByIdAndDelete(req.params.id); if(!d) return res.status(404).json({error:'Not found'}); res.json({ ok:true }); }