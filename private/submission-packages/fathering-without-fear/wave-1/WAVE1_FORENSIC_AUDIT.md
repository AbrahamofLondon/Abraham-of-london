# WAVE 1 FORENSIC AUDIT — Fathering Without Fear

> **SUPERSEDED READINESS STATUS — DO NOT USE FOR SEND-DAY APPROVAL.**
>
> This audit records the previous Wave 1 export state before the insertion of Ch.20 — "The Available Tools" and the 27-chapter package lock. It is retained as historical forensic evidence only. Current Wave 1 readiness must be checked against `WAVE_1_CH20_INTEGRATION_LOCK_REPORT.md` and any update-required note generated after Ch.20 integration.

Audit date: 2026-06-26

Scope: private/submission-packages/fathering-without-fear/wave-1/

Source of truth used (paths reflect pre-tidy root locations — now under `current-package/`):

- private/submission-packages/fathering-without-fear/current-package/01-clean-manuscript.md
- private/submission-packages/fathering-without-fear/current-package/02-first-50-pages.md
- private/submission-packages/fathering-without-fear/current-package/03-query-letter.md
- private/submission-packages/fathering-without-fear/current-package/04-one-page-synopsis.md
- private/submission-packages/fathering-without-fear/current-package/05-long-synopsis.md
- private/submission-packages/fathering-without-fear/current-package/06-nonfiction-proposal-core.md
- private/submission-packages/fathering-without-fear/current-package/06-author-bio.md
- private/submission-packages/fathering-without-fear/current-package/08-legal-privacy-note.md
- private/submission-packages/fathering-without-fear/current-package/10-agent-target-list.md
- private/submission-packages/fathering-without-fear/current-package/11-submission-wave-plan.md
- private/submission-packages/fathering-without-fear/current-package/12-agent-personalisation-notes.md

## Executive Result

Wave 1 exports were treated as suspect and rebuilt where outward-facing defects were found. Rebuilt DOCX files were opened by extracting word/document.xml, counting words/characters, checking first and last text, scanning placeholder strings, and inspecting metadata XML.

No submissions, forms, test forms, draft emails, live portals, or emails were opened or sent.

## Inventory

| Path | File type | Size | Purpose | Outward-facing? | Status |
|---|---:|---:|---|---|---|
| $rel | MD | 2676 | Internal materials plan | No | INTERNAL ONLY |
| $rel | MD | 3698 | Internal personalised query draft | No | INTERNAL ONLY |
| $rel | MD | 3406 | Internal checklist | No | INTERNAL ONLY |
| $rel | MD | 4375 | Internal submission notes | No | INTERNAL ONLY |
| $rel | MD | 10805 | Internal materials plan | No | INTERNAL ONLY |
| $rel | MD | 3760 | Internal personalised query draft | No | INTERNAL ONLY |
| $rel | MD | 2544 | Internal checklist | No | INTERNAL ONLY |
| $rel | MD | 4724 | Internal submission notes | No | INTERNAL ONLY |
| $rel | MD | 6727 | Internal materials plan | No | INTERNAL ONLY |
| $rel | MD | 4130 | Internal personalised query draft | No | INTERNAL ONLY |
| $rel | MD | 2682 | Internal checklist | No | INTERNAL ONLY |
| $rel | MD | 5396 | Internal submission notes | No | INTERNAL ONLY |
| $rel | MD | 3009 | Internal materials plan | No | INTERNAL ONLY |
| $rel | MD | 6371 | Internal personalised query draft | No | INTERNAL ONLY |
| $rel | MD | 3426 | Internal checklist | No | INTERNAL ONLY |
| $rel | MD | 5192 | Internal submission notes | No | INTERNAL ONLY |
| $rel | MD | 2828 | Internal materials plan | No | INTERNAL ONLY |
| $rel | MD | 5472 | Internal personalised query draft | No | INTERNAL ONLY |
| $rel | MD | 2888 | Internal checklist | No | INTERNAL ONLY |
| $rel | MD | 4799 | Internal submission notes | No | INTERNAL ONLY |
| $rel | MD | 3491 | Internal materials plan | No | INTERNAL ONLY |
| $rel | MD | 4311 | Internal personalised query draft | No | INTERNAL ONLY |
| $rel | MD | 2905 | Internal checklist | No | INTERNAL ONLY |
| $rel | MD | 5817 | Internal submission notes | No | INTERNAL ONLY |
| $rel | MD | 2301 | Internal source for export | No | INTERNAL ONLY |
| $rel | MD | 180 | Superseded internal export note | No | INTERNAL ONLY |
| $rel | DOCX | 3891 | Cover letter DOCX | Yes | VALID |
| $rel | DOCX | 30478 | First 50 pages DOCX | Yes | VALID |
| $rel | MD | 77364 | Internal source for export | No | INTERNAL ONLY |
| $rel | MD | 523 | DOCX metadata report | No | VALID |
| $rel | MD | 529 | DOCX metadata report | No | VALID |
| $rel | MD | 8911 | Internal source for export | No | INTERNAL ONLY |
| $rel | MD | 2417 | Internal source for export | No | INTERNAL ONLY |
| $rel | MD | 180 | Superseded internal export note | No | INTERNAL ONLY |
| $rel | DOCX | 6734 | Chapter outline DOCX | Yes | VALID |
| $rel | DOCX | 3927 | Cover letter DOCX | Yes | VALID |
| $rel | DOCX | 9650 | Sample chapters DOCX | Yes | VALID |
| $rel | MD | 526 | DOCX metadata report | No | VALID |
| $rel | MD | 517 | DOCX metadata report | No | VALID |
| $rel | MD | 544 | DOCX metadata report | No | VALID |
| $rel | MD | 180 | Superseded internal export note | No | INTERNAL ONLY |
| $rel | DOCX | 16643 | 30-page manuscript sample DOCX | Yes | VALID |
| $rel | DOCX | 6736 | Chapter outline DOCX | Yes | VALID |
| $rel | DOCX | 6960 | Nonfiction proposal DOCX | Yes | VALID |
| $rel | MD | 541 | DOCX metadata report | No | VALID |
| $rel | MD | 544 | DOCX metadata report | No | VALID |
| $rel | MD | 523 | DOCX metadata report | No | VALID |
| $rel | MD | 10032 | Internal source for export | No | INTERNAL ONLY |
| $rel | MD | 180 | Superseded internal export note | No | INTERNAL ONLY |
| $rel | MD | 6641 | QueryManager field-ready text | Yes | VALID |
| $rel | MD | 7520 | Paste-ready sample text block | Yes | VALID |
| $rel | MD | 180 | Superseded internal export note | No | INTERNAL ONLY |
| $rel | TXT | 27059 | Paste-ready email body | Yes | VALID |
| $rel | MD | 4825 | Aevitas field-ready text | Yes | VALID |
| $rel | MD | 180 | Superseded internal export note | No | INTERNAL ONLY |
| $rel | MD | 77280 | Paste-ready sample text block | Yes | VALID |
| $reportRel | MD | pending | Forensic audit report | No | INTERNAL ONLY |

## Defects Found and Rebuilt

Defective outward-facing issues found:

- Nicola first-50 DOCX was previously suspect; rebuilt from current first-50/current clean manuscript content and verified to start at Chapter 1 — Hounslow Call.
- First-50 and 30-page sample exports contained an internal AUTHOR DETAIL NEEDED paragraph inherited from package source; removed from outward exports.
- Multiple DOCX files contained markdown residue from source markdown; all 8 DOCX files were rebuilt as clean OpenXML text exports.
- Elise proposal contained forbidden legal memoir language; rebuilt with clean positioning.
- Reiko email body contained only a placeholder instruction for first 20 pages; rebuilt with actual Ch.1–Ch.4 text.
- Aevitas and Michael sample text files contained instructions/source-path logic rather than paste-ready sample blocks; rebuilt with actual sample text blocks.
- Chapter outline source foregrounded legal/privacy handling; outward version rebuilt to protect private material without allegation/court-finding language.
- Existing export-readiness reports were not forensic evidence; replaced with internal notes pointing to this audit.

Files rebuilt or updated: 36 tracked Wave 1 files plus this audit report.

## DOCX Verification

| Agent | DOCX file | Word count | First text check | Placeholder-free? | Purpose match? |
|---|---|---:|---|---|---|
| Nicola Chang | $([IO.Path]::GetFileName(@{Path=private\submission-packages\fathering-without-fear\wave-1\exports\01-nicola-chang-dha\Fathering-Without-Fear-Cover-Letter-Nicola-Chang.docx; Size=3891; Characters=2281; Words=361; First300=Dear Nicola Chang, I am writing because your stated touchstones — Janet Malcolm's moral seriousness, Annie Ernaux's compression, work that navigates the boundary between fiction and nonfiction — describe the aesthetic this manuscript aims for. Fathering Without Fear is a memoir that moves with the ; Last300=ief architecture of Grief Is for People and the spare self-interrogation of Stay True, while moving through fatherhood, inheritance, faith, and institutional pressure in its own register. The complete manuscript is available on request. Thank you for your time and consideration. Abraham of London; PlaceholderHits=; CoreXml=<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Fathering Without Fear — Cover Letter — Nicola Chang</dc:title><dc:subject></dc:subject><dc:creator>Abraham of London</dc:creator><cp:keywords></cp:keywords><dc:description></dc:description><cp:lastModifiedBy></cp:lastModifiedBy><cp:revision>1</cp:revision><dcterms:created xsi:type="dcterms:W3CDTF">2026-06-26T07:33:50Z</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">2026-06-26T07:33:50Z</dcterms:modified><cp:category></cp:category></cp:coreProperties>; AppXml=<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Template>Normal.dotm</Template><TotalTime>0</TotalTime><Pages>1</Pages><Words>361</Words><Characters>2281</Characters><Application>Codex OpenXML export</Application><DocSecurity>0</DocSecurity><Lines>0</Lines><Paragraphs>10</Paragraphs><ScaleCrop>false</ScaleCrop><Company></Company><LinksUpToDate>false</LinksUpToDate><CharactersWithSpaces>2281</CharactersWithSpaces><SharedDoc>false</SharedDoc><HyperlinkBase></HyperlinkBase><HyperlinksChanged>false</HyperlinksChanged><AppVersion>16.0000</AppVersion></Properties>; CustomXml=; HasComments=False; HasRevisions=False; HasAbsolutePaths=False}.Path)) | 361 | Dear Nicola Chang, I am writing because your stated touchstones — Janet Malcolm's moral se | Yes | Yes |
| Nicola Chang | $([IO.Path]::GetFileName(@{Path=private\submission-packages\fathering-without-fear\wave-1\exports\01-nicola-chang-dha\Fathering-Without-Fear-First-50-Pages-Nicola-Chang.docx; Size=30478; Characters=76916; Words=14002; First300=Chapter 1 — Hounslow Call In February 2021, Abraham was sitting on his bed in Hounslow when the court called. It was not a video hearing. There was no screen to look into, no face to read, no room to enter. Only a voice. A voice could enter without giving him anything to look at. A voice could ask; Last300=k with a black lamp. Shelves. A small bin. Plain white walls. Grey carpet. A small wooden chest. Nothing in the room tried to welcome him. It simply received him. He sat there with the black suitcase. He had left a house full of people and arrived in a room that contained only what he could carry.; PlaceholderHits=; CoreXml=<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Fathering Without Fear — First 50 Pages — Nicola Chang</dc:title><dc:subject></dc:subject><dc:creator>Abraham of London</dc:creator><cp:keywords></cp:keywords><dc:description></dc:description><cp:lastModifiedBy></cp:lastModifiedBy><cp:revision>1</cp:revision><dcterms:created xsi:type="dcterms:W3CDTF">2026-06-26T07:33:50Z</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">2026-06-26T07:33:50Z</dcterms:modified><cp:category></cp:category></cp:coreProperties>; AppXml=<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Template>Normal.dotm</Template><TotalTime>0</TotalTime><Pages>1</Pages><Words>14002</Words><Characters>76916</Characters><Application>Codex OpenXML export</Application><DocSecurity>0</DocSecurity><Lines>0</Lines><Paragraphs>340</Paragraphs><ScaleCrop>false</ScaleCrop><Company></Company><LinksUpToDate>false</LinksUpToDate><CharactersWithSpaces>76916</CharactersWithSpaces><SharedDoc>false</SharedDoc><HyperlinkBase></HyperlinkBase><HyperlinksChanged>false</HyperlinksChanged><AppVersion>16.0000</AppVersion></Properties>; CustomXml=; HasComments=False; HasRevisions=False; HasAbsolutePaths=False}.Path)) | 14002 | Chapter 1 — Hounslow Call In February 2021, Abraham was sitting on his bed in Hounslow whe | Yes | Yes |
| Kate Evans | $([IO.Path]::GetFileName(@{Path=private\submission-packages\fathering-without-fear\wave-1\exports\02-kate-evans-pfd\Fathering-Without-Fear-Chapter-Outline-Kate-Evans.docx; Size=6734; Characters=8830; Words=1478; First300=Fathering Without Fear — Chapter Outline Movement One: Inheritance (Chapters 1–11) The book opens with a phone call in Hounslow, west London. Abraham is sitting on his bed when the court calls. He has not been notified. He is not prepared. But he stays on the line, because the other possibility is; Last300=tion. Fear governed the early years: fear of loss, fear of the system, fear of saying the wrong thing in the wrong room. The book's arc is toward a love that does not require fear to sustain it. Not fearlessness as bravado, but love as a practice strong enough to survive what the situation demanded.; PlaceholderHits=; CoreXml=<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Fathering Without Fear — Chapter Outline — Kate Evans</dc:title><dc:subject></dc:subject><dc:creator>Abraham of London</dc:creator><cp:keywords></cp:keywords><dc:description></dc:description><cp:lastModifiedBy></cp:lastModifiedBy><cp:revision>1</cp:revision><dcterms:created xsi:type="dcterms:W3CDTF">2026-06-26T07:33:50Z</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">2026-06-26T07:33:50Z</dcterms:modified><cp:category></cp:category></cp:coreProperties>; AppXml=<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Template>Normal.dotm</Template><TotalTime>0</TotalTime><Pages>1</Pages><Words>1478</Words><Characters>8830</Characters><Application>Codex OpenXML export</Application><DocSecurity>0</DocSecurity><Lines>0</Lines><Paragraphs>30</Paragraphs><ScaleCrop>false</ScaleCrop><Company></Company><LinksUpToDate>false</LinksUpToDate><CharactersWithSpaces>8830</CharactersWithSpaces><SharedDoc>false</SharedDoc><HyperlinkBase></HyperlinkBase><HyperlinksChanged>false</HyperlinksChanged><AppVersion>16.0000</AppVersion></Properties>; CustomXml=; HasComments=False; HasRevisions=False; HasAbsolutePaths=False}.Path)) | 1478 | Fathering Without Fear — Chapter Outline Movement One: Inheritance (Chapters 1–11) The boo | Yes | Yes |
| Kate Evans | $([IO.Path]::GetFileName(@{Path=private\submission-packages\fathering-without-fear\wave-1\exports\02-kate-evans-pfd\Fathering-Without-Fear-Cover-Letter-Kate-Evans.docx; Size=3927; Characters=2399; Words=386; First300=Dear Kate Evans, I am seeking representation for Fathering Without Fear, and I'm querying you because of the way you've described your nonfiction interests: writing that says something about how we live, from strong narrative voices to the extraordinary texture of personal experience. This memoir c; Last300=interrogation of Stay True, while moving through fatherhood, inheritance, faith, and institutional pressure in its own register. The complete manuscript is available on request. Thank you for your time and consideration. Abraham of London A chapter outline and three sample chapters are attached.; PlaceholderHits=; CoreXml=<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Fathering Without Fear — Cover Letter — Kate Evans</dc:title><dc:subject></dc:subject><dc:creator>Abraham of London</dc:creator><cp:keywords></cp:keywords><dc:description></dc:description><cp:lastModifiedBy></cp:lastModifiedBy><cp:revision>1</cp:revision><dcterms:created xsi:type="dcterms:W3CDTF">2026-06-26T07:33:50Z</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">2026-06-26T07:33:50Z</dcterms:modified><cp:category></cp:category></cp:coreProperties>; AppXml=<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Template>Normal.dotm</Template><TotalTime>0</TotalTime><Pages>1</Pages><Words>386</Words><Characters>2399</Characters><Application>Codex OpenXML export</Application><DocSecurity>0</DocSecurity><Lines>0</Lines><Paragraphs>11</Paragraphs><ScaleCrop>false</ScaleCrop><Company></Company><LinksUpToDate>false</LinksUpToDate><CharactersWithSpaces>2399</CharactersWithSpaces><SharedDoc>false</SharedDoc><HyperlinkBase></HyperlinkBase><HyperlinksChanged>false</HyperlinksChanged><AppVersion>16.0000</AppVersion></Properties>; CustomXml=; HasComments=False; HasRevisions=False; HasAbsolutePaths=False}.Path)) | 386 | Dear Kate Evans, I am seeking representation for Fathering Without Fear, and I'm querying  | Yes | Yes |
| Kate Evans | $([IO.Path]::GetFileName(@{Path=private\submission-packages\fathering-without-fear\wave-1\exports\02-kate-evans-pfd\Fathering-Without-Fear-Sample-Chapters-Chs1-3-Kate-Evans.docx; Size=9650; Characters=17920; Words=3309; First300=Fathering Without Fear — Sample Chapters (Chapters 1-3) Chapter 1 — Hounslow Call In February 2021, Abraham was sitting on his bed in Hounslow when the court called. It was not a video hearing. There was no screen to look into, no face to read, no room to enter. Only a voice. A voice could enter ; Last300=rhaps because the road ahead felt large enough to need the name his father had chosen. Perhaps because the name had been waiting and the season had arrived. He did not understand it. He wrote it anyway. He spent years not knowing that he was the answer to a question he had not been present to hear.; PlaceholderHits=; CoreXml=<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Fathering Without Fear — Sample Chapters 1-3 — Kate Evans</dc:title><dc:subject></dc:subject><dc:creator>Abraham of London</dc:creator><cp:keywords></cp:keywords><dc:description></dc:description><cp:lastModifiedBy></cp:lastModifiedBy><cp:revision>1</cp:revision><dcterms:created xsi:type="dcterms:W3CDTF">2026-06-26T07:33:50Z</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">2026-06-26T07:33:50Z</dcterms:modified><cp:category></cp:category></cp:coreProperties>; AppXml=<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Template>Normal.dotm</Template><TotalTime>0</TotalTime><Pages>1</Pages><Words>3309</Words><Characters>17920</Characters><Application>Codex OpenXML export</Application><DocSecurity>0</DocSecurity><Lines>0</Lines><Paragraphs>80</Paragraphs><ScaleCrop>false</ScaleCrop><Company></Company><LinksUpToDate>false</LinksUpToDate><CharactersWithSpaces>17920</CharactersWithSpaces><SharedDoc>false</SharedDoc><HyperlinkBase></HyperlinkBase><HyperlinksChanged>false</HyperlinksChanged><AppVersion>16.0000</AppVersion></Properties>; CustomXml=; HasComments=False; HasRevisions=False; HasAbsolutePaths=False}.Path)) | 3309 | Fathering Without Fear — Sample Chapters (Chapters 1-3) Chapter 1 — Hounslow Call In Febru | Yes | Yes |
| Elise Dillsworth | $([IO.Path]::GetFileName(@{Path=private\submission-packages\fathering-without-fear\wave-1\exports\03-elise-dillsworth\Fathering-Without-Fear-30-Page-Sample-Elise-Dillsworth.docx; Size=16643; Characters=37573; Words=6846; First300=Fathering Without Fear — 30-Page Writing Sample Chapter 1 — Hounslow Call In February 2021, Abraham was sitting on his bed in Hounslow when the court called. It was not a video hearing. There was no screen to look into, no face to read, no room to enter. Only a voice. A voice could enter without ; Last300=who trusted him. He had trusted this child before. He had seen something in him from birth, something the child himself had not chosen and did not understand. Trust, in David Senior, did not always arrive as tenderness. Sometimes it arrived as responsibility handed back to the person who had spoken.; PlaceholderHits=; CoreXml=<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Fathering Without Fear — 30-Page Sample — Elise Dillsworth</dc:title><dc:subject></dc:subject><dc:creator>Abraham of London</dc:creator><cp:keywords></cp:keywords><dc:description></dc:description><cp:lastModifiedBy></cp:lastModifiedBy><cp:revision>1</cp:revision><dcterms:created xsi:type="dcterms:W3CDTF">2026-06-26T07:33:50Z</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">2026-06-26T07:33:50Z</dcterms:modified><cp:category></cp:category></cp:coreProperties>; AppXml=<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Template>Normal.dotm</Template><TotalTime>0</TotalTime><Pages>1</Pages><Words>6846</Words><Characters>37573</Characters><Application>Codex OpenXML export</Application><DocSecurity>0</DocSecurity><Lines>0</Lines><Paragraphs>180</Paragraphs><ScaleCrop>false</ScaleCrop><Company></Company><LinksUpToDate>false</LinksUpToDate><CharactersWithSpaces>37573</CharactersWithSpaces><SharedDoc>false</SharedDoc><HyperlinkBase></HyperlinkBase><HyperlinksChanged>false</HyperlinksChanged><AppVersion>16.0000</AppVersion></Properties>; CustomXml=; HasComments=False; HasRevisions=False; HasAbsolutePaths=False}.Path)) | 6846 | Fathering Without Fear — 30-Page Writing Sample Chapter 1 — Hounslow Call In February 2021 | Yes | Yes |
| Elise Dillsworth | $([IO.Path]::GetFileName(@{Path=private\submission-packages\fathering-without-fear\wave-1\exports\03-elise-dillsworth\Fathering-Without-Fear-Chapter-Outline-Elise-Dillsworth.docx; Size=6736; Characters=8830; Words=1478; First300=Fathering Without Fear — Chapter Outline Movement One: Inheritance (Chapters 1–11) The book opens with a phone call in Hounslow, west London. Abraham is sitting on his bed when the court calls. He has not been notified. He is not prepared. But he stays on the line, because the other possibility is; Last300=tion. Fear governed the early years: fear of loss, fear of the system, fear of saying the wrong thing in the wrong room. The book's arc is toward a love that does not require fear to sustain it. Not fearlessness as bravado, but love as a practice strong enough to survive what the situation demanded.; PlaceholderHits=; CoreXml=<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Fathering Without Fear — Chapter Outline — Elise Dillsworth</dc:title><dc:subject></dc:subject><dc:creator>Abraham of London</dc:creator><cp:keywords></cp:keywords><dc:description></dc:description><cp:lastModifiedBy></cp:lastModifiedBy><cp:revision>1</cp:revision><dcterms:created xsi:type="dcterms:W3CDTF">2026-06-26T07:33:50Z</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">2026-06-26T07:33:50Z</dcterms:modified><cp:category></cp:category></cp:coreProperties>; AppXml=<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Template>Normal.dotm</Template><TotalTime>0</TotalTime><Pages>1</Pages><Words>1478</Words><Characters>8830</Characters><Application>Codex OpenXML export</Application><DocSecurity>0</DocSecurity><Lines>0</Lines><Paragraphs>30</Paragraphs><ScaleCrop>false</ScaleCrop><Company></Company><LinksUpToDate>false</LinksUpToDate><CharactersWithSpaces>8830</CharactersWithSpaces><SharedDoc>false</SharedDoc><HyperlinkBase></HyperlinkBase><HyperlinksChanged>false</HyperlinksChanged><AppVersion>16.0000</AppVersion></Properties>; CustomXml=; HasComments=False; HasRevisions=False; HasAbsolutePaths=False}.Path)) | 1478 | Fathering Without Fear — Chapter Outline Movement One: Inheritance (Chapters 1–11) The boo | Yes | Yes |
| Elise Dillsworth | $([IO.Path]::GetFileName(@{Path=private\submission-packages\fathering-without-fear\wave-1\exports\03-elise-dillsworth\Fathering-Without-Fear-Proposal-Elise-Dillsworth.docx; Size=6960; Characters=9855; Words=1591; First300=Fathering Without Fear — Nonfiction Proposal I'm writing to you because your work as a commissioning editor at Virago and as co-founder of the Diversity in Publishing Network signals a particular sensitivity to the kind of writing this memoir represents — work that is international in arc, serious ; Last300=moir about inheritance, faith, grief, and the cost of remaining present. It is approximately 47,000 words across twenty-four chapters. Sample Pages The complete manuscript is available on request. For initial submission, a 30-page sample beginning with Chapter 1 is provided as a separate document.; PlaceholderHits=; CoreXml=<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Fathering Without Fear — Proposal — Elise Dillsworth</dc:title><dc:subject></dc:subject><dc:creator>Abraham of London</dc:creator><cp:keywords></cp:keywords><dc:description></dc:description><cp:lastModifiedBy></cp:lastModifiedBy><cp:revision>1</cp:revision><dcterms:created xsi:type="dcterms:W3CDTF">2026-06-26T07:33:50Z</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">2026-06-26T07:33:50Z</dcterms:modified><cp:category></cp:category></cp:coreProperties>; AppXml=<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Template>Normal.dotm</Template><TotalTime>0</TotalTime><Pages>1</Pages><Words>1591</Words><Characters>9855</Characters><Application>Codex OpenXML export</Application><DocSecurity>0</DocSecurity><Lines>0</Lines><Paragraphs>44</Paragraphs><ScaleCrop>false</ScaleCrop><Company></Company><LinksUpToDate>false</LinksUpToDate><CharactersWithSpaces>9855</CharactersWithSpaces><SharedDoc>false</SharedDoc><HyperlinkBase></HyperlinkBase><HyperlinksChanged>false</HyperlinksChanged><AppVersion>16.0000</AppVersion></Properties>; CustomXml=; HasComments=False; HasRevisions=False; HasAbsolutePaths=False}.Path)) | 1591 | Fathering Without Fear — Nonfiction Proposal I'm writing to you because your work as a com | Yes | Yes |

## Metadata Verification

| DOCX file | Metadata report | Result |
|---|---|---|
| $doc | $(C:\aol-check-visual\private\submission-packages\fathering-without-fear\wave-1\exports\01-nicola-chang-dha\metadata-scrub-report-cover-letter.md.FullName.Substring((Get-Location).Path.Length+1) -replace '\\','/') | PASS — Author intentionally set to Abraham of London; no private metadata detected. |
| $doc | $(C:\aol-check-visual\private\submission-packages\fathering-without-fear\wave-1\exports\01-nicola-chang-dha\metadata-scrub-report-first-50-pages.md.FullName.Substring((Get-Location).Path.Length+1) -replace '\\','/') | PASS — Author intentionally set to Abraham of London; no private metadata detected. |
| $doc | $(C:\aol-check-visual\private\submission-packages\fathering-without-fear\wave-1\exports\02-kate-evans-pfd\metadata-scrub-report-chapter-outline.md.FullName.Substring((Get-Location).Path.Length+1) -replace '\\','/') | PASS — Author intentionally set to Abraham of London; no private metadata detected. |
| $doc | $(C:\aol-check-visual\private\submission-packages\fathering-without-fear\wave-1\exports\02-kate-evans-pfd\metadata-scrub-report-cover-letter.md.FullName.Substring((Get-Location).Path.Length+1) -replace '\\','/') | PASS — Author intentionally set to Abraham of London; no private metadata detected. |
| $doc | $(C:\aol-check-visual\private\submission-packages\fathering-without-fear\wave-1\exports\02-kate-evans-pfd\metadata-scrub-report-sample-chapters.md.FullName.Substring((Get-Location).Path.Length+1) -replace '\\','/') | PASS — Author intentionally set to Abraham of London; no private metadata detected. |
| $doc | $(C:\aol-check-visual\private\submission-packages\fathering-without-fear\wave-1\exports\03-elise-dillsworth\metadata-scrub-report-30-page-sample.md.FullName.Substring((Get-Location).Path.Length+1) -replace '\\','/') | PASS — Author intentionally set to Abraham of London; no private metadata detected. |
| $doc | $(C:\aol-check-visual\private\submission-packages\fathering-without-fear\wave-1\exports\03-elise-dillsworth\metadata-scrub-report-chapter-outline.md.FullName.Substring((Get-Location).Path.Length+1) -replace '\\','/') | PASS — Author intentionally set to Abraham of London; no private metadata detected. |
| $doc | $(C:\aol-check-visual\private\submission-packages\fathering-without-fear\wave-1\exports\03-elise-dillsworth\metadata-scrub-report-proposal.md.FullName.Substring((Get-Location).Path.Length+1) -replace '\\','/') | PASS — Author intentionally set to Abraham of London; no private metadata detected. |

## Agent Readiness

| Agent | Required materials | Verified actual materials | Ready after send-day live check? |
|---|---|---|---|
| Nicola Chang | Word documents only: cover letter + first 50 pages/sample | Verified DOCX cover letter and first-50-pages DOCX. First-50 starts at Chapter 1 — Hounslow Call; no PDF. | Yes, after live DHA requirement check and author approval. |
| Kate Evans | Cover letter + chapter outline + three sample chapters | Verified DOCX cover letter, chapter outline, and Chs.1–3 sample chapters. | Yes, after live PFD requirement check and author approval. |
| Elise Dillsworth | Proposal + chapter outline + 30-page sample | Verified DOCX proposal, chapter outline, and 30-page manuscript sample. | Yes, after live agency requirement check and author approval. |
| Michael Bourret | QueryManager field-ready text; no email | Verified segmented querymanager-fields.md and paste-ready Chapter 1 sample block. | Yes, after live QueryManager field check and author approval. |
| Reiko Davis | Single paste-ready email body; no attachments | Verified eiko-davis-email-body.txt includes query, bio, and actual Chs.1–4 first-20-pages text. | Yes, after live DeFiore requirement check and author approval. |
| Sarah Levitt | Aevitas field-ready form text; first 50 pages if required | Verified evitas-fields.md and paste-ready first-50-pages sample block. | Yes, after live Aevitas form check and author approval. |

## Bad-Term Audit

Outward-facing files and extracted DOCX text were scanned for: shocking; explosive; unprecedented; groundbreaking; urgent; must-read; system tried to destroy; false allegations; court battle; parental alienation; narcissist; dismissive avoidant; trauma memoir; devotional memoir; legal memoir; my truth; silenced; cancelled; vindication; legally sensitive.

Exact outward-facing hits after rebuild: none.

Internal checklist/legal-review reminders may remain only in internal files and are classified as INTERNAL ONLY in the inventory.

## Stale-Fact Audit

Outward-facing files and extracted DOCX text were scanned for: 23 chapters; twenty-three chapters; 45,008; 50,000 words; 50,000-word; Ch.23 Final Room; ch23-final-room; 22 chapters; 38,000; 38k; standing in his flat; girl called Jumoke; fire destroyed the family home; seven years of supervised contact.

Exact outward-facing hits after rebuild: none.

Current outward-facing facts at the time of this historical audit used: 24 chapters; approximately 47,000 words; Ch.24 Final Room where chapter numbering is referenced. This is superseded by the 27-chapter package after Ch.20 — "The Available Tools" integration.

## Legal/Privacy Audit

- Ch.17 not foregrounded: PASS. Outward exports do not narrate allegation/arrest/court-finding detail for Ch.17.
- Ch.20 not foregrounded: PASS. Relationship material is restrained; diagnosis language removed.
- Damisi protected: PASS. Damisi is rendered as a child, never as evidence.
- No diagnosis language: PASS. dismissive avoidant removed from outward materials.
- No court-detail overexposure: PASS. Court/process appears only where intrinsic to Ch.1 manuscript sample or high-level positioning, not as legal argument.

## Repo Hygiene Notes

Temporary rebuild helper 	mp-wave1-rebuild.mjs was used during audit and must be removed before commit.

## Validation Plan

Required validations before commit:

- pnpm contentlayer2 build
- pnpm typecheck
- git diff --check
- pnpm mdx:integrity
- pnpm mdx:gate

## Submission Status

No submissions were sent. No live forms were opened. No test forms were opened. No draft emails were sent. No agent emails were sent.
