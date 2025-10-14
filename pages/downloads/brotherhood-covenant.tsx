import BrandFrame from "@/components/print/BrandFrame";

export default function BrotherhoodCovenant() {
  return (
    <BrandFrame
      title="Brotherhood Covenant"
      subtitle="90-day commitment to presence, truth, confidentiality, practical service, and family protection."
    >
      <h2>The Code: Presence & Integrity</h2>
      <ol>
        <li><strong>Show up.</strong> Weekly touchpoints. No ghosts.</li>
        <li><strong>Tell the truth.</strong> Confess struggles before collapse.</li>
        <li><strong>Carry weight.</strong> Pray, call, turn up at the door.</li>
        <li><strong>Protect families.</strong> No gossip; cover, don’t expose.</li>
        <li><strong>Build together.</strong> Study, train, serve. Produce—not just post.</li>
      </ol>

      <h3>Red Flags (address quickly)</h3>
      <ul>
        <li>Chronic lateness without accountability</li>
        <li>Secret-keeping, triangulation, spiritual one-upmanship</li>
      </ul>

      <h2>Weekly Rhythm (60–90 min)</h2>
      <ul>
        <li><strong>Scripture (45)</strong> — read & discuss</li>
        <li><strong>Formation (30)</strong> — habits, money, marriage, parenting</li>
        <li><strong>Intercession (15)</strong> — names, needs, next steps</li>
      </ul>

      <blockquote>
        “Two are better than one… If either falls, one helps the other up.” — Ecclesiastes 4:9–10
      </blockquote>

      <h2 className="mt-8">Covenant Statement</h2>
      <p>
        We commit for 90 days to weekly presence, truth-telling, confidentiality, practical service,
        and family protection. We will correct in love, receive correction with humility, and
        escalate conflict quickly for peace.
      </p>

      <div className="not-prose mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-lightGrey/90 p-4">
            <div className="mb-6">
              <div className="mb-5 border-b border-lightGrey pb-5">
                <div className="h-6" />
                <span className="text-xs text-deepCharcoal/60">Name</span>
              </div>
              <div className="mb-5 border-b border-lightGrey pb-5">
                <div className="h-6" />
                <span className="text-xs text-deepCharcoal/60">Signature</span>
              </div>
              <div className="border-b border-lightGrey pb-5">
                <div className="h-6" />
                <span className="text-xs text-deepCharcoal/60">Date</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11.5px] text-deepCharcoal/60">
              <span>90-day cohort</span>
              <span className="text-forest">The Brotherhood Code</span>
            </div>
          </div>
        ))}
      </div>
    </BrandFrame>
  );
}
