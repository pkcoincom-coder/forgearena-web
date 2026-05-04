import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, GET, OPTIONS"};
function generateOTP(){return Math.floor(100000+Math.random()*900000).toString();}
function emailTemplate(code){return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif}.box{max-width:480px;margin:40px auto;background:#0d0d0e;border:1px solid #333;border-top:3px solid #FF6600;padding:40px 30px}.logo-1{font-size:28px;font-weight:900;color:#fff;letter-spacing:4px;text-align:center}.logo-2{font-size:20px;font-weight:900;color:#FFD700;letter-spacing:6px;display:block;text-align:center;margin-top:4px}.title{font-size:22px;color:#fff;text-align:center;margin:20px 0 10px;font-weight:700}.sub{font-size:14px;color:#aaa;text-align:center;margin-bottom:30px}.code-box{background:rgba(255,102,0,.08);border:2px solid #FF6600;padding:24px;text-align:center;margin:20px 0}.code{font-size:42px;font-weight:900;color:#FFD700;letter-spacing:12px;font-family:'Courier New',monospace}.note{font-size:12px;color:#888;text-align:center;margin-top:10px}.footer{font-size:11px;color:#666;text-align:center;margin-top:30px;line-height:1.6}</style></head><body><div class="box"><div class="logo-1">FORGE</div><div class="logo-2">ARENA</div><div class="title">Your Login Code</div><div class="sub">Use this code to sign in to your dashboard</div><div class="code-box"><div class="code">${code}</div><div class="note">Expires in 10 minutes</div></div><p style="color:#aaa;font-size:13px;text-align:center;line-height:1.6">If you did not request this code please ignore this email.</p><div class="footer">Forge Arena · Global Esports Platform<br>forgearena.net</div></div></body></html>`;}
serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  try{
    const RESEND_API_KEY=Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL=Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY=Deno.env.get("SB_SERVICE_ROLE_KEY");
    if(!RESEND_API_KEY)throw new Error("Missing RESEND_API_KEY");
    if(!SUPABASE_URL||!SERVICE_KEY)throw new Error("Missing Supabase credentials");
    const{email}=await req.json();
    if(!email)throw new Error("Email required");
    const normalizedEmail=email.trim().toLowerCase();
    const supabase=createClient(SUPABASE_URL,SERVICE_KEY);
    const{data:user}=await supabase.from("waitlist").select("email").eq("email",normalizedEmail).maybeSingle();
    if(!user)return new Response(JSON.stringify({success:false,error:"Email not registered. Please join the waitlist first."}),{headers:{...corsHeaders,"Content-Type":"application/json"},status:404});
    const tenMinutesAgo=new Date(Date.now()-10*60*1000).toISOString();
    const{data:recentOtps}=await supabase.from("otp_codes").select("id").eq("email",normalizedEmail).gte("created_at",tenMinutesAgo);
    if(recentOtps&&recentOtps.length>=3)return new Response(JSON.stringify({success:false,error:"Too many requests. Please wait 10 minutes."}),{headers:{...corsHeaders,"Content-Type":"application/json"},status:429});
    const code=generateOTP();
    const expiresAt=new Date(Date.now()+10*60*1000).toISOString();
    await supabase.from("otp_codes").insert([{email:normalizedEmail,code,purpose:"login",expires_at:expiresAt}]);
    const fromAddress=Deno.env.get("RESEND_FROM")||"Forge Arena <onboarding@resend.dev>";
    const resendRes=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":`Bearer ${RESEND_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({from:fromAddress,to:[normalizedEmail],subject:`${code} is your Forge Arena login code`,html:emailTemplate(code)})});
    if(!resendRes.ok){const errText=await resendRes.text();throw new Error(`Resend error: ${resendRes.status} ${errText}`);}
    return new Response(JSON.stringify({success:true,message:"OTP sent. Check your email.",expires_in_seconds:600}),{headers:{...corsHeaders,"Content-Type":"application/json"},status:200});
  }catch(error){
    return new Response(JSON.stringify({success:false,error:error?.message||String(error)}),{headers:{...corsHeaders,"Content-Type":"application/json"},status:500});
  }
});
