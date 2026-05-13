import zipfile, os, tempfile, shutil
from xml.etree import ElementTree as ET
from xml.etree.ElementTree import Element

src = r"C:\Users\UserPC\OneDrive\Desktop\Damisi\MAY 2026\ZC25P00843_fathers_bundle_may26.odt"
dst_dir = r"C:\Users\UserPC\OneDrive\Desktop\Damisi\MAY 2026"

shutil.copy2(src, os.path.join(dst_dir, "ZC25P00843_fathers_bundle_may26_BACKUP2.odt"))
print("Backup created")

z = zipfile.ZipFile(src, 'r')
content = z.read('content.xml').decode('utf-8')
z.close()

root = ET.fromstring(content)
T = 'urn:oasis:names:tc:opendocument:xmlns:text:1.0'
O = 'urn:oasis:names:tc:opendocument:xmlns:office:1.0'

body = root.find(f'{{{O}}}body')
te = body.find(f'{{{O}}}text')

def mp(style, text):
    p = Element(f'{{{T}}}p')
    p.set(f'{{{T}}}style-name', style)
    p.text = text
    return p

def mh(style, text):
    h = Element(f'{{{T}}}h')
    h.set(f'{{{T}}}style-name', style)
    h.text = text
    return h

idx = []
idx.append(mp('P4', ''))
idx.append(mh('P1', 'INDEX'))
idx.append(mp('P4', '\u2500' * 55))
idx.append(mh('P9', 'DOCUMENT OVERVIEW'))
idx.append(mp('P10', 'Case Number: ZC25P00843'))
idx.append(mp('P10', 'Child: Oluwadamisi Joshua Adaramola-Yakubu (DOB: 22 February 2019, age 7)'))
idx.append(mp('P10', 'Hearing: 19 May 2026, 10:00am \u2014 Before Recorder Millington'))
idx.append(mp('P10', 'Applicant: Abraham Oluseun Adaramola (Father, Litigant in Person)'))
idx.append(mp('P10', 'Respondent: Fausat Olabimpe Yakubu (Mother)'))
idx.append(mp('P4', ''))
idx.append(mh('P9', 'INDEX OF CONTENTS'))

sections = [
    ("Position Statement (Pages 1\u20137)", [
        "Section 1 \u2014 Summary",
        "Section 2 \u2014 What Has Already Been Decided",
        "Section 3 \u2014 Why Supervision Has Served Its Purpose",
        "Section 4 \u2014 The Mother\u2019s Position and the Practical Consequences",
        "Section 5 \u2014 Welfare Checklist (s.1(3) Children Act 1989)",
        "Section 6 \u2014 Final Order Sought",
        "Section 7 \u2014 If the Court Considers a Transition Necessary",
        "Section 8 \u2014 Conclusion",
        "Statement of Truth",
    ]),
    ("Schedule A \u2014 Proposed Final Order", [
        "Living Arrangements, Spending Time, Handovers, Communication",
        "Cancellation and Make-Up, School, Passport and Travel",
        "Liberty to Apply, Section 91(14), Duration, Warning Notice",
    ]),
    ("Schedule B \u2014 The Child\u2019s Recorded Words and Behaviour", [
        "15 entries from Proactiv Contact Centre reports (Jul 2024 \u2013 Apr 2026)",
        "Notes for the Court",
    ]),
    ("Schedule C \u2014 Contact Compliance Record", [
        "24 entries (July 2024 \u2013 April 2026)",
        "Summary: 14 held, 8 missed, 0 attributable to Father",
    ]),
    ("CAFCASS Letter to the Court (22 July 2025)", [
        "Safeguarding interviews with Mother and Father",
        "Analysis and advice to the court",
    ]),
    ("Proactiv Contact Centre Reports", [
        "Report: 23 December 2025 (Rocshai Palmer)",
        "Report: 25 April 2026 (Rocshai Palmer)",
        "Report: 28 February 2026 (Rocshai Palmer)",
        "Report: 29 November 2025 (Nadine Graham)",
        "Report: 31 January 2026 (cancelled)",
        "Report: 28 March 2026 (Nadine Graham)",
        "Report: 29 March 2025 (Nadine Graham)",
        "Report: 17 February 2025 (Nadine Graham)",
        "Report: 25 January 2025 (Maria Righetti)",
        "Report: 4 January 2025 (cancelled)",
        "Report: 30 November 2024 (Cassandra Rowe)",
        "Report: 30 October 2024 (Nadine Graham)",
        "Report: 28 September 2024 (S. Headley)",
        "Report: 31 August 2024 (no show)",
        "Report: 27 July 2024 (Deanne Phillips)",
    ]),
    ("Email Correspondence", [
        "Missed and Altered Contacts (August 2024 \u2013 September 2025)",
        "Extension request correspondence (November 2024)",
        "Christmas contact arrangements (December 2024)",
        "February 2025 rescheduling correspondence",
        "July\u2013September 2025 missed contact correspondence",
    ]),
    ("School Correspondence", [
        "Father\u2019s request to be added to mailing list and emergency contact (Dec 2024)",
        "Follow-up on parental involvement (Jan 2025)",
        "School response from Miss M Ryan, Interim Headteacher (Jan 2025)",
    ]),
    ("Appendix D \u2014 Court Orders", [
        "D1 \u2014 Child Arrangements Order (1 October 2020) \u2014 Recorder Millington",
        "D2 \u2014 Final/Contact Order (27 July 2023) \u2014 Recorder Millington",
        "D3 \u2014 Final/Contact Order (12 October 2023) \u2014 Recorder Millington",
        "D4 \u2014 Final/Contact Order (6 February 2024) \u2014 Recorder Millington",
        "D5 \u2014 Final/Contact Order (10 May 2024) \u2014 Recorder Millington",
        "Order of Recorder Valentine (18 November 2025)",
    ]),
    ("HMCTS Correspondence", [
        "Transcript funding decision (5 September 2025)",
        "Father\u2019s response regarding judicial continuity",
    ]),
]

for title, items in sections:
    idx.append(mh('P9', title))
    for item in items:
        idx.append(mp('P11', f'\u2022 {item}'))
    idx.append(mp('P4', ''))

for e in idx:
    te.append(e)

x = ET.tostring(root, encoding='unicode')
x = '<?xml version="1.0" encoding="UTF-8"?>\n' + x.split('?>', 1)[-1].strip()

tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.odt')
tp = tmp.name
tmp.close()

nz = zipfile.ZipFile(tp, 'w', zipfile.ZIP_DEFLATED)
oz = zipfile.ZipFile(src, 'r')
for item in oz.infolist():
    data = oz.read(item.filename)
    if item.filename == 'content.xml':
        nz.writestr(item, x.encode('utf-8'))
    else:
        nz.writestr(item, data)
oz.close()
nz.close()

output_path = os.path.join(dst_dir, "ZC25P00843_fathers_bundle_may26_WITH_INDEX.odt")
os.replace(tp, output_path)
print(f"Written to: {output_path}")

z2 = zipfile.ZipFile(output_path, 'r')
c2 = z2.read('content.xml').decode('utf-8')
z2.close()
print(f'INDEX found: {"INDEX" in c2}')
print(f'DOCUMENT OVERVIEW found: {"DOCUMENT OVERVIEW" in c2}')
print(f'INDEX OF CONTENTS found: {"INDEX OF CONTENTS" in c2}')
print('Done - index added at end of document')
