import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, GET, OPTIONS"};
function otp(){return Math.floor(100000+Math.random()*900000).toString();}
serve(async(req)=>{
if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
try{
const RESEND=Deno.env.get("RESEND_API_KEY");
const URL=Deno.env.get("SUPABASE_URL");
const KEY=Deno.env.get("SUPABASE_ANON_KEY");
if(!RESEND)throw new Error("Missing RESEND_API_KEY");
if(!URL||!KEY)throw new Error("Missing SUPABASE_ANON_KEY url="+URL+" key="+!!KEY);
const{email}=await req.json();
if(!email)throw new Error("Email required");
const e=email.trim().toLowerCase();
const sb=createClient(URL,KEY);
const{data:u,error:ue}=await sb.from("waitlist").select("email").eq("email",e).maybeSingle();
if(ue)throw new Error("DB:"+ue.message);
if(!u)return new Response(JSON.stringify({success:false,error:"Email not registered. Please join the waitlist first."}),{headers:{...cors,"Content-Type":"application/json"},status:404});
const code=otp();
const exp=new Date(Date.now()+600000).toISOString();
await sb.from("otp_codes").insert([{email:e,code,purpose:"login",expires_at:exp}]);
const from=Deno.env.get("RESEND_FROM")||"Forge Arena <onboarding@resend.dev>";
const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":`Bearer ${RESEND}`,"Content-Type":"application/json"},body:JSON.stringify({from,to:[e],subject:code+" is your Forge Arena login code",html:`<div style="background:#0d0d0e;padding:40px;font-family:Arial;max-width:480px;margin:auto"><div style="text-align:center;margin-bottom:20px"><div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:4px">FORGE</div><div style="font-size:20px;font-weight:900;color:#FFD700;letter-spacing:6px">ARENA</div></div><p style="color:#aaa;text-align:center">Your login code:</p><div style="background:#111;border:2px solid #FF6600;padding:24px;text-align:center;margin:20px 0"><span style="font-size:42px;font-weight:900;color:#FFD700;letter-spacing:12px;font-family:monospace">${code}</span><p style="color:#888;font-size:12px;margin-top:10px">Expires in 10 minutes</p></div><p style="color:#666;font-size:11px;text-align:center;margin-top:20px">Forge Arena · forgearena.net</p></div>`})});
if(!r.ok){const et=await r.text();throw new Error("Resend:"+r.status+" "+et);}
return new Response(JSON.stringify({success:true,message:"OTP sent."}),{headers:{...cors,"Content-Type":"application/json"}});
}catch(err){
return new Response(JSON.stringify({success:false,error:err.message}),{headers:{...cors,"Content-Type":"application/json"},status:500});
}
});
