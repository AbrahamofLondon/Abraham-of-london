import * as React from "react";
export const config = { runtime: "nodejs" };
export default function Resources(){
  return (
    <main style={{padding:16,fontFamily:"system-ui,Segoe UI,Roboto"}}>
      {/* TODO: restore real content */}
<h1>Resources</h1>
      <p>Temporarily stubbed. The original page was referencing <code>allResources</code> at build time.</p>
    </main>
  );
}
export async function getServerSideProps(){ return { props:{} }; }
