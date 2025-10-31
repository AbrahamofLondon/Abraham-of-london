import * as React from "react";
export const config = { runtime: "nodejs" };
export default function Page(){
  return (
    <main style={{padding:16,fontFamily:"system-ui,Segoe UI,Roboto"}}>
      {/* TODO: restore real content */}
<h1>Download: Brotherhood Cue Card</h1>
      <p>Temporarily stubbed to unblock the build.</p>
    </main>
  );
}
export async function getServerSideProps(){ return { props:{} }; }
