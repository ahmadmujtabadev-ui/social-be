

// ── src/controllers/participants.js ─────────────────────────────────────────
import { Participant } from '../models/participant.js';

export async function listParticipants(_req,res){ res.json(await Participant.find().sort({createdAt:-1})); }
export async function createParticipant(req,res){ try{ const b=req.body; if(!b.name||!b.email||!b.dob||!b.category||!b.ageGroup||!b.phone||!b.excitement) return res.status(400).json({error:'Missing required fields'}); const created=await Participant.create({ name:b.name, email:b.email, dob:new Date(b.dob), category:b.category, ageGroup:b.ageGroup, phone:b.phone, heardVia:Array.isArray(b.heardVia)?b.heardVia:(b.heardVia?[b.heardVia]:[]), excitement:Number(b.excitement), instagram:b.instagram, termsAcceptedAt:b.terms?new Date():undefined }); res.status(201).json(created);}catch(e){ res.status(500).json({error:'Failed to create participant'});} }
export async function getParticipant(req,res){ const i=await Participant.findById(req.params.id); if(!i) return res.status(404).json({error:'Not found'}); res.json(i); }
export async function updateParticipant(req,res){ const u=await Participant.findByIdAndUpdate(req.params.id,{ $set:req.body },{ new:true }); if(!u) return res.status(404).json({error:'Not found'}); res.json(u); }
export async function removeParticipant(req,res){ const d=await Participant.findByIdAndDelete(req.params.id); if(!d) return res.status(404).json({error:'Not found'}); res.json({ ok:true }); }