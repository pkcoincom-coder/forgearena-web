import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, GET, OPTIONS"};
serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  try{
    const SUPABASE_URL=Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY=Deno.env.get("SB_SERVICE_ROLE_KEY");
    if(!SUPABASE_URL||!SERVICE_KEY)throw new Error("Missing Supabase credentials");
    const{email,code}=await req.json();
    if(!email||!code)throw new Error("Email and code required");
    const normalizedEmail=email.trim().toLowerCase();
    const cleanCode=String(code).trim();
    if(!/^\d{6}$/.test(cleanCode))return new Response(JSON.stringify({success:false,error:"Invalid code format"}),{headers:{...corsHeaders,"Content-Type":"application/json"},status:400});
    const supabase=createClient(SUPABASE_URL,SERVICE_KEY);
    const now=new Date().toISOString();
    const{data:otpData,error:otpErr}=await supabase.from("otp_codes").select("*").eq("email",normalizedEmail).eq("code",cleanCode).eq("used",false).gt("expires_at",now).order("created_at",{ascending:false}).limit(1).maybeSingle();
    if(otpErr)throw new Error(`DB error: ${otpErr.message}`);
    if(!otpData)return new Response(JSON.stringify({success:false,error:"Invalid or expired code. Please request a new one."}),{headers:{...corsHeaders,"Content-Type":"application/json"},status:400});
    await supabase.from("otp_codes").update({used:true}).eq("id",otpData.id);
    const{data:user}=await supabase.from("waitlist").select("*").eq("email",normalizedEmail).maybeSingle();
    if(!user)throw new Error("User not found");
    const sessionToken=btoa(`${normalizedEmail}:${Date.now()}:${Math.random()}`);
    return new Response(JSON.stringify({success:true,user:user,session_token:sessionToken}),{headers:{...corsHeaders,"Content-Type":"application/json"},status:200});
  }catch(error){
    return new Response(JSON.stringify({success:false,error:error?.message||String(error)}),{headers:{...corsHeaders,"Content-Type":"application/json"},status:500});
  }
});
