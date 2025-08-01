(()=>{var e={};e.id=323,e.ids=[323],e.modules={2507:(e,t,s)=>{"use strict";s.d(t,{U:()=>c});var r=s(80261),a=s(44999);async function c(){let e=await (0,a.UL)();return(0,r.createServerClient)("https://enpplseddbfstmefufee.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVucHBsc2VkZGJmc3RtZWZ1ZmVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNTgyMDUsImV4cCI6MjA2NTYzNDIwNX0.TxFqh1lGx91iKIOIZC-qnjT6n0s1jnBGH9R8SXMwCAE",{cookies:{getAll:()=>e.getAll(),setAll(t){try{t.forEach(({name:t,value:s,options:r})=>e.set(t,s,r))}catch{}}}})}},3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},11997:e=>{"use strict";e.exports=require("punycode")},27910:e=>{"use strict";e.exports=require("stream")},29021:e=>{"use strict";e.exports=require("fs")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},33873:e=>{"use strict";e.exports=require("path")},34631:e=>{"use strict";e.exports=require("tls")},39727:()=>{},44870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},47990:()=>{},51906:e=>{function t(e){var t=Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}t.keys=()=>[],t.resolve=t,t.id=51906,e.exports=t},55511:e=>{"use strict";e.exports=require("crypto")},55569:(e,t,s)=>{"use strict";s.r(t),s.d(t,{patchFetch:()=>b,routeModule:()=>m,serverHooks:()=>E,workAsyncStorage:()=>h,workUnitAsyncStorage:()=>w});var r={};s.r(r),s.d(r,{GET:()=>g});var a=s(96559),c=s(48088),o=s(37719),i=s(2507),u=s(32190),l=s(29021),n=s.n(l),p=s(33873),d=s.n(p);async function g(){try{let e=await (0,i.U)(),t={success:!0,messages:[]};try{let e=d().join(process.cwd(),"public","uploads");n().existsSync(e)?t.messages.push("Filesystem fallback directory already exists"):(n().mkdirSync(e,{recursive:!0}),t.messages.push("Created filesystem fallback directory"))}catch(e){t.messages.push(`Filesystem setup error: ${e.message}`)}try{let{data:s,error:r}=await e.storage.listBuckets();if(r)t.messages.push(`Error checking buckets: ${r.message}`);else if(s?.some(e=>"cow-images"===e.name))t.messages.push('Bucket "cow-images" already exists');else{t.messages.push('Bucket "cow-images" does not exist, will create it');let{error:s}=await e.storage.createBucket("cow-images",{public:!0,fileSizeLimit:0xa00000});if(s){t.messages.push(`Error creating bucket: ${s.message}`);try{await e.rpc("execute_sql",{sql_query:`INSERT INTO storage.buckets (id, name, owner, created_at, updated_at, public)
                           VALUES ('cow-images', 'cow-images', auth.uid(), now(), now(), true)
                           ON CONFLICT (id) DO NOTHING;`}),t.messages.push("Created bucket via direct SQL (fallback)")}catch(e){t.messages.push(`SQL bucket creation failed: ${e.message}`)}}else t.messages.push("Bucket created successfully")}}catch(e){t.messages.push(`Bucket check error: ${e.message}`)}try{let{data:s,error:r}=await e.rpc("execute_sql",{sql_query:`
          -- Enable RLS on storage.objects
          ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
          
          -- Create policy to allow public read access
          DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
          CREATE POLICY "Allow public read access" 
            ON storage.objects 
            FOR SELECT 
            USING (bucket_id = 'cow-images');
          
          -- Create policy to allow authenticated users to insert objects
          DROP POLICY IF EXISTS "Allow authenticated insert" ON storage.objects;
          CREATE POLICY "Allow authenticated insert" 
            ON storage.objects 
            FOR INSERT 
            WITH CHECK (bucket_id = 'cow-images' AND auth.role() = 'authenticated');
          
          -- Create policy to allow authenticated users to update their own objects
          DROP POLICY IF EXISTS "Allow authenticated update" ON storage.objects;
          CREATE POLICY "Allow authenticated update" 
            ON storage.objects 
            FOR UPDATE 
            USING (bucket_id = 'cow-images' AND auth.role() = 'authenticated');
          
          -- Create policy to allow authenticated users to delete their own objects
          DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;
          CREATE POLICY "Allow authenticated delete" 
            ON storage.objects 
            FOR DELETE 
            USING (bucket_id = 'cow-images' AND auth.role() = 'authenticated');
          
          -- Enable RLS on storage.buckets
          ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
          
          -- Create policy to allow authenticated users to create buckets
          DROP POLICY IF EXISTS "Allow authenticated create buckets" ON storage.buckets;
          CREATE POLICY "Allow authenticated create buckets" 
            ON storage.buckets 
            FOR INSERT 
            WITH CHECK (auth.role() = 'authenticated');
          
          -- Create policy to allow public read access to buckets
          DROP POLICY IF EXISTS "Allow public read buckets" ON storage.buckets;
          CREATE POLICY "Allow public read buckets" 
            ON storage.buckets 
            FOR SELECT 
            USING (true);
        `});r?t.messages.push(`Error setting up RLS: ${r.message}`):t.messages.push("Storage RLS policies applied successfully")}catch(e){t.messages.push(`RLS function error: ${e.message}`)}try{let e=`test-fs-${Date.now()}.txt`,s=d().join(process.cwd(),"public","uploads");n().existsSync(s)||n().mkdirSync(s,{recursive:!0}),n().writeFileSync(d().join(s,e),"test content"),n().existsSync(d().join(s,e))?(t.messages.push(`Filesystem storage verified: /uploads/${e}`),n().unlinkSync(d().join(s,e)),t.messages.push("Test file cleaned up")):t.messages.push("Filesystem storage failed: File not created")}catch(e){t.messages.push(`Filesystem test error: ${e.message}`)}return u.NextResponse.json(t)}catch(e){return console.error("Fix storage error:",e),u.NextResponse.json({success:!1,error:e.message||"Unknown error"},{status:500})}}let m=new a.AppRouteRouteModule({definition:{kind:c.RouteKind.APP_ROUTE,page:"/api/fix-storage/route",pathname:"/api/fix-storage",filename:"route",bundlePath:"app/api/fix-storage/route"},resolvedPagePath:"D:\\Work\\Gaushala Cow Managment\\Gaushala Cow Managment\\src\\app\\api\\fix-storage\\route.ts",nextConfigOutput:"",userland:r}),{workAsyncStorage:h,workUnitAsyncStorage:w,serverHooks:E}=m;function b(){return(0,o.patchFetch)({workAsyncStorage:h,workUnitAsyncStorage:w})}},55591:e=>{"use strict";e.exports=require("https")},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},74075:e=>{"use strict";e.exports=require("zlib")},78335:()=>{},79428:e=>{"use strict";e.exports=require("buffer")},79551:e=>{"use strict";e.exports=require("url")},81630:e=>{"use strict";e.exports=require("http")},91645:e=>{"use strict";e.exports=require("net")},94735:e=>{"use strict";e.exports=require("events")},96487:()=>{}};var t=require("../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[447,875,580],()=>s(55569));module.exports=r})();