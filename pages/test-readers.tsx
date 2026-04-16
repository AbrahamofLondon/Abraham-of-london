// pages/test-readers.tsx
// Test page for Reader System implementation

import React from 'react';
import Head from 'next/head';
import { 
  CanonReader, 
  CanonCallout,
  VaultReader,
  VaultDataBlock,
  VaultCodeBlock,
  VaultCallout,
  getReaderForContent,
  detectContentType 
} from '@/components/readers';

export default function TestReadersPage() {
  const editorialContent = `
    Institutional memory is not merely a record of past decisions; 
    it is the architecture within which future choices are framed. 
    Every organization builds its own cognitive scaffolding—sometimes 
    intentionally, often by accretion.
    
    Consider the boardroom where a billion-dollar acquisition is debated. 
    The arguments presented are not born in that moment; they are echoes 
    of decisions made five, ten, twenty years prior.
  `;
  
  const technicalContent = `
    The rate limiting system uses a token bucket algorithm 
    with distributed Redis storage for horizontal scaling.
    
    Configuration includes 1200 tokens per minute with a 
    bucket size of 2400 tokens and refill rate of 20 tokens per second.
  `;
  
  const detectedEditorialType = detectContentType(editorialContent);
  const detectedTechnicalType = detectContentType(technicalContent);
  
  const editorialReader = getReaderForContent(detectedEditorialType);
  const technicalReader = getReaderForContent(detectedTechnicalType);
  
  return (
    <>
      <Head>
        <title>Reader System Test - Abraham of London</title>
        <meta name="description" content="Test implementation of Canon and Vault Reader systems" />
      </Head>
      
      <div className="min-h-screen bg-[#030305] p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-serif text-white mb-8">
            Reader System Implementation Test
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Canon Reader Test */}
            <div>
              <div className="mb-6 p-4 bg-white/5 rounded">
                <h2 className="text-xl font-serif text-white mb-2">Canon Reader</h2>
                <p className="text-white/66 text-sm">
                  {editorialReader.description}
                </p>
                <div className="mt-2 font-mono text-xs text-white/50">
                  Detected as: {detectedEditorialType.toUpperCase()}
                </div>
              </div>
              
              <div className="border border-white/10 rounded-lg overflow-hidden">
                <CanonReader
                  title="The Architecture of Decision"
                  subtitle="How institutional memory shapes strategic choice"
                  meta={
                    <div className="flex items-center gap-4 text-sm">
                      <span>Abraham of London</span>
                      <span>•</span>
                      <span>24 March 2025</span>
                      <span>•</span>
                      <span>28 minute read</span>
                    </div>
                  }
                  surfaceOption="A"
                >
                  <p>
                    Institutional memory is not merely a record of past decisions; 
                    it is the architecture within which future choices are framed. 
                    Every organization builds its own cognitive scaffolding—sometimes 
                    intentionally, often by accretion.
                  </p>
                  
                  <h2>The Weight of Precedent</h2>
                  
                  <p>
                    Consider the boardroom where a billion-dollar acquisition is debated. 
                    The arguments presented are not born in that moment; they are echoes 
                    of decisions made five, ten, twenty years prior.
                  </p>
                  
                  <CanonCallout type="insight" title="Structural Insight">
                    Organizations do not make decisions in vacuums. They make them 
                    within architectures built by their own history.
                  </CanonCallout>
                  
                  <h3>Three Layers of Institutional Memory</h3>
                  
                  <ul>
                    <li><strong>Explicit</strong>: Documented policies, minutes, reports</li>
                    <li><strong>Tacit</strong>: Unwritten rules, cultural norms, "how we do things here"</li>
                    <li><strong>Structural</strong>: Physical and digital systems that enforce certain behaviors</li>
                  </ul>
                  
                  <blockquote>
                    The most dangerous precedent is the one you don't know you're setting.
                  </blockquote>
                  
                  <p>
                    To change an organization's decision-making architecture requires 
                    more than new policies. It requires excavating the tacit and 
                    structural layers that silently guide choice.
                  </p>
                </CanonReader>
              </div>
            </div>
            
            {/* Vault Reader Test */}
            <div>
              <div className="mb-6 p-4 bg-white/5 rounded">
                <h2 className="text-xl font-sans font-semibold text-white mb-2">Vault Reader</h2>
                <p className="text-white/66 text-sm">
                  {technicalReader.description}
                </p>
                <div className="mt-2 font-mono text-xs text-white/50">
                  Detected as: {detectedTechnicalType.toUpperCase()}
                </div>
              </div>
              
              <div className="border border-white/10 rounded-lg overflow-hidden">
                <VaultReader
                  title="API Rate Limit Implementation v3.2"
                  meta={
                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span>TECHNICAL SPECIFICATION</span>
                      <span>•</span>
                      <span>VERSION 3.2</span>
                      <span>•</span>
                      <span>LAST UPDATED: 2025-03-24</span>
                    </div>
                  }
                  keyMetrics={
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="font-mono text-xs uppercase text-white/66">Requests/Min</div>
                        <div className="text-2xl font-semibold">1,200</div>
                      </div>
                      <div>
                        <div className="font-mono text-xs uppercase text-white/66">Error Rate</div>
                        <div className="text-2xl font-semibold">0.04%</div>
                      </div>
                      <div>
                        <div className="font-mono text-xs uppercase text-white/66">Avg Latency</div>
                        <div className="text-2xl font-semibold">87ms</div>
                      </div>
                    </div>
                  }
                  structuredSections={[
                    {
                      id: "implementation",
                      title: "IMPLEMENTATION",
                      content: (
                        <>
                          <p>
                            The rate limiting system uses a token bucket algorithm 
                            with distributed Redis storage for horizontal scaling.
                          </p>
                          
                          <VaultDataBlock
                            title="BUCKET CONFIGURATION"
                            data={[
                              { label: "Tokens per minute", value: "1200" },
                              { label: "Bucket size", value: "2400" },
                              { label: "Refill rate", value: "20 tokens/sec" },
                            ]}
                          />
                          
                          <VaultCodeBlock language="typescript">
{`interface RateLimitConfig {
  tokensPerMinute: number;
  bucketSize: number;
  refillRate: number;
  namespace: string;
}

const config: RateLimitConfig = {
  tokensPerMinute: 1200,
  bucketSize: 2400,
  refillRate: 20,
  namespace: 'api:v3'
};`}
                          </VaultCodeBlock>
                        </>
                      ),
                    },
                    {
                      id: "error-handling",
                      title: "ERROR HANDLING",
                      content: (
                        <>
                          <p>
                            When rate limits are exceeded, the system returns HTTP 429 
                            with appropriate headers.
                          </p>
                          
                          <VaultCallout type="warning" title="DEPRECATION NOTICE">
                            The legacy X-RateLimit headers will be removed in v4.0. 
                            Migrate to RateLimit-* headers immediately.
                          </VaultCallout>
                          
                          <table>
                            <thead>
                              <tr>
                                <th>Header</th>
                                <th>Description</th>
                                <th>Example</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td><code>RateLimit-Limit</code></td>
                                <td>Requests per minute</td>
                                <td><code>1200</code></td>
                              </tr>
                              <tr>
                                <td><code>RateLimit-Remaining</code></td>
                                <td>Remaining requests</td>
                                <td><code>843</code></td>
                              </tr>
                              <tr>
                                <td><code>RateLimit-Reset</code></td>
                                <td>Seconds until reset</td>
                                <td><code>42</code></td>
                              </tr>
                            </tbody>
                          </table>
                        </>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          </div>
          
          {/* Implementation Notes */}
          <div className="mt-12 p-6 bg-white/5 rounded-lg border border-white/10">
            <h2 className="text-xl font-sans font-semibold text-white mb-4">
              Implementation Notes
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-serif text-lg text-white mb-2">Canon Reader Spec</h3>
                <ul className="space-y-2 text-white/75 text-sm">
                  <li>✅ Serif typography (Cormorant Garamond)</li>
                  <li>✅ 18-20px body, 1.7-1.85 line height</li>
                  <li>✅ Max width: 72ch (non-negotiable)</li>
                  <li>✅ Paragraph gap: 1.2em – 1.5em</li>
                  <li>✅ Section gap: 2.5em – 3.5em</li>
                  <li>✅ Text NEVER on unstable backgrounds</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-sans text-lg font-semibold text-white mb-2">Vault Reader Spec</h3>
                <ul className="space-y-2 text-white/75 text-sm">
                  <li>✅ Sans typography (Inter)</li>
                  <li>✅ 15-17px body, 1.6-1.75 line height</li>
                  <li>✅ Labels: Mono, 10-12px, uppercase</li>
                  <li>✅ Max width: 80ch</li>
                  <li>✅ Background: dark steel (#060609)</li>
                  <li>✅ Text: high contrast (rgba(245,247,250,0.94))</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/10">
              <h3 className="font-mono text-sm uppercase tracking-widest text-white/66 mb-3">
                Validation Functions
              </h3>
              <div className="text-white/75 text-sm">
                <p>Use <code className="font-mono text-xs bg-white/10 px-1 py-0.5 rounded">validateCanonContent()</code> and <code className="font-mono text-xs bg-white/10 px-1 py-0.5 rounded">validateVaultContent()</code> to check compliance.</p>
                <p className="mt-2">Automatic detection via <code className="font-mono text-xs bg-white/10 px-1 py-0.5 rounded">detectContentType()</code> and <code className="font-mono text-xs bg-white/10 px-1 py-0.5 rounded">getReaderForContent()</code>.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}