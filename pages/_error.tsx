import * as React from "react";
export const config = { runtime: "nodejs" };
export default function ErrorPage(){
  return (
    <main style={{padding:16,fontFamily:"system-ui,Segoe UI,Roboto"}}>
      {/* TODO: restore real content */}
<h1>Something went wrong</h1>
      <p>Temporary error page to unblock the build.</p>
    </main>
  );
}




