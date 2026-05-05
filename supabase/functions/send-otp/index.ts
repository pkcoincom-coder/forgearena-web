import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, GET, OPTIONS"};
function generateOTP(){return Math.floor(100000+Math.random()*900000).toString();}
serve(async(req)=>{
if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
try{
const RESEND_API_KEY=Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL=Deno.env.get("SUPABASE_URL");
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if(!RESEND_API_KEY)throw new Error("Missing RESEND_API_KEY");
if(!SUPABASE_URL||!SERVICE_KEY)throw new Error("Missing SERVICE_KEY");
const{email}=await req.json();
if(!email)throw new Error("Email required");
const normalizedEmail=email.trim().toLowerCase();
const supabase=createClient(SUPABASE_URL,SERVICE_KEY);
const{data:user,error:userErr}=await supabase.from("waitlist").select("email").eq("email",normalizedEmail).maybeSingle();
if(userErr)throw new Error("DB: "+userErr.message);
if(!user)return new Response(JSON.stringify({success:false,error:"Email not registered. Please join the waitlist first."}),{headers:{...corsHeaders,"Content-Type":"application/json"},status:404});
const tenMinutesAgo=new Date(Date.now()-10*60*1000).toISOString();
const{data:recentOtps}=await supabase.from("otp_codes").select("id").eq("email",normalizedEmail).gte("created_at",tenMinutesAgo);
if(recentOtps&&recentOtps.length>=3)return new Response(JSON.stringify({success:false,error:"Too many requests. Wait 10 minutes."}),{headers:{...corsHeaders,"Content-Type":"application/json"},status:429});
const code=generateOTP();
const expiresAt=new Date(Date.now()+10*60*1000).toISOString();
await supabase.from("otp_codes").insert([{email:normalizedEmail,code,purpose:"login",expires_at:expiresAt}]);
const from=Deno.env.get("RESEND_FROM")||"Forge Arena <onboarding@resend.dev>";
const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":`Bearer ${RESEND_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({from,to:[normalizedEmail],subject:`${code} is your Forge Arena login code`,html:`<div style="background:#0d0d0e;padding:40px;font-family:Arial;max-width:480px;margin:auto"><div style="text-align:center"><div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:4px">FORGE</div><div style="font-size:20px;font-weight:900;color:#FFD700;letter-spacing:6px">ARENA</div></div><p style="color:#aaa;text-align:center">Your login code:</p><div style="background:#111;border:2px solid #FF6600;padding:24px;text-align:center;margin:20px 0"><span style="font-size:42px;font-weight:900;color:#FFD700;letter-spacing:12px;font-family:monospace">${code}</span><p style="color:#888;font-size:12px;margin-top:10px">Expires in 10 minutes</p></div><p style="color:#666;font-size:11px;text-align:center;margin-top:20px">Forge Arena · forgearena.net</p></div>`})});
if(!r.ok){const e=await r.text();throw new Error(`Resend: ${r.status} ${e}`);}
return new Response(JSON.stringify({success:true,message:"OTP sent.",expires_in_seconds:600}),{headers:{...corsHeaders,"Content-Type":"application/json"},status:200});
}catch(error){
return new Response(JSON.stringify({success:false,error:error?.message||String(error)}),{headers:{...corsHeaders,"Content-Type":"application/json"},status:500});
}
});
