# CA content review list

For a Chartered Accountant (or recent qualifier) reviewing the CA program before students rely on it.

## How the content was written

- Original material in ICAI exam style, written for the **ICAI new scheme, May 2027 attempts onward**
  (Income-tax Act 2025 as amended by Finance Act 2026; GST after the 22 September 2025 rate changes).
- Every numeric answer was computed in code. Several tracks build every figure from scripts that
  fail on a wrong result.
- Chapters that depend on law, tax rates, thresholds, section numbers or standards carry
  `draft: true` (114 of 176). The app shows a "Draft: verify against ICAI material" notice on them.
  Remove `draft` from a chapter in its track JSON once it is reviewed.
- Below: the specific points the writers could not confirm from an official source. Question ids
  are in the track files under `src/content/tracks/`.

## Highest priority

1. **Income-tax Act 2025 section numbers** (`ca-i-income-tax`, `ca-fin-dt`, `ca-fin-ibs`). Verified
   against several sources: 156 (rebate), 202 (new regime), 123 (old 80C). Single-source mapping
   (TaxGuru): 3, 11, 15-19, 20-25, 26+, 67+, 92-93, 99, 108-121, 263, 266, 392-394, 9, 58, 159-173,
   178-181, 195, 206, 332-355, 402(47). Everything else is cited as "corresponds to section X of
   the 1961 Act". Check against ICAI's section mapping document.
2. **Finance Act 2026 changes taken from budget summaries, not the enacted text** (`ca-fin-dt`):
   MAT at 14% as final tax and MAT credit rules (03-companies-firms q04, q13; surcharge on MAT q02,
   q06), TCS and manpower TDS changes (05-tds-advance-tax q02, q07, q14), due dates and updated
   returns (06-assessment-appeals q05, q10), buyback taxation (02-capital-gains q07), safe harbour
   (08-transfer-pricing q08, q11), incentives (10-equalisation-levy-other q08).
3. **GST**: commencement of the Finance Act 2026 post-supply discount change (`ca-i-gst` 06, 09;
   `ca-fin-idt`); State lists for the ₹40 lakh and ₹10 lakh registration limits
   (`ca-i-gst-08-registration` q01, q08, case); section 39(10) GSTR-3B/GSTR-1 rule
   (`ca-i-gst-10-payment-returns` lesson).

## By paper

### Foundation

- **Accounting** (`ca-f-accounting`): Table F interest caps 10% / 12% (10 lesson, untested);
  AS 10 change in depreciation method (05 q11); bills public-holiday rule (06 q07) and protest
  (06 q13); sweat equity exception (10 q06); section 128 reference (01 lesson); wording of 03 q04.
- **Business Laws** (`ca-f-law`): LLP designated partner 120 days (07 q03, q14); 50-partner limit
  (07 q12); sections 3A, 2(87), 2(6) (08 q14); section 138 time limits and 143A/148 (09 q05, q12,
  q14); section 69 ₹100 (06 q13); minor's necessaries (02 q15); Seventh Schedule list entries (01
  lesson).
- **Quantitative Aptitude** (`ca-f-quant`): Poisson tolerance (12 q13); EMI rounding (04 q02);
  seating convention (10 q01-q04); blood relation reading (10 q05); syllabus depth of matrices,
  cubics and integration by parts.
- **Business Economics** (`ca-f-economics`): M1-M4 and SDF/MSF wording (09 q02, q11); FDI 10%
  threshold (10 lesson); multiplier-accelerator attribution (06 q07). Track has 10 chapters
  (money market and international trade split).

### Intermediate

- **Advanced Accounting** (`ca-i-adv-accounting`): non-company entity levels after ICAI's 2024
  revision (not tested); buyback debt-equity and CRR conventions (06 q08, q11); SMC and Ind AS
  roadmap (01 q12, q13); Schedule III rounding and current maturities (05 q03, q09); unrealised
  profit and minority interest (10 q08, q10); AS 15 expected return (03 q13).
- **Corporate and Other Laws** (`ca-i-corporate-law`): Corporate Laws (Amendment) Bill 2026 not
  enacted, CSR ₹5 crore tested at current law (08); deposits 10% base for eligible companies (04
  q05); charge penalties (05 q12); ADT-2 and removal procedure (08 q14); rule 13 internal audit
  (08 q05); General Clauses Act clause numbers (10 lesson, q07); day counting (10 q04).
- **Income-tax** (`ca-i-income-tax`): see section numbers above; assumed CII 400 (07 q07); return
  due dates (10, untested); new-regime house property loss carry forward (not stated);
  rebate against special-rate income (08 q06).
- **GST** (`ca-i-gst`): see GST above; GST 2.0 nil-rated items (05 lesson, untested); GTA and
  reverse charge changes deliberately untested (03); 5% hotel rate (04 q07).
- **Cost and Management Accounting** (`ca-i-costing`): Taylor 83% / 125% (03 lesson); contract
  profit fractions (07 q02, q03, q12); LIFO wording (02 lesson); under/over absorption cause
  (04 q10).
- **Auditing and Ethics** (`ca-i-audit`): section 141 limits and rotation rules (08 q05, q09,
  q13-q15); CARO 2020 applicability (07 q04, q11, q16); CA Act clause numbers (10 q05-q07, q12,
  q15); crop-season NPA rules (09 q08, q09); SQC 1 assembly and retention (06 q05, q07); placement
  of company audit content in the ICAI syllabus.
- **Financial Management** (`ca-i-fm`): ARR average investment with working capital (07 q04); cash
  cost basis in the working capital case (09 q01-q03); ideal leverage mix (06 q08); venture
  capital methods (02 q08).
- **Strategic Management** (`ca-i-sm`): ICAI has 5 SM chapters; this track has 8. Chapter 08
  (digital and sustainable strategy) is not a separate ICAI chapter; strategic control, Balanced
  Scorecard (07), Rumelt (07 q06, q12), hourglass structure (06 q08) and GE matrix (04 q09, q15)
  may be outside the current material.

### Final

- **Financial Reporting** (`ca-fin-fr`): Ind AS 1 para 74 carve-out vs later amendments (01 q11);
  puttable MF units (04 q12); Ind AS 12 / 37 amendments (06 lesson); discount rate (07 q05);
  bargain purchase to capital reserve (09 q02); Ind AS 101 D7AA (10 lesson).
- **Advanced Financial Management** (`ca-fin-afm`): rounding conventions in VaR (01 q11),
  derivatives (06 q01-q04) and Black-Scholes N(d) values (06 q13).
- **Advanced Auditing** (`ca-fin-audit`): IFC exemption conditions and small company thresholds
  (04 q15); SQC 1 rotation (01 q09); SA 299 common report (02 q14); IRAC rules given the April
  2027 ECL start (08 q05, q07, q12); rule 13 thresholds and BRSR Core glide path (09 q01, q07,
  q13); Regulation 192, certificate of posting, section 141(3)(d)(i), NFRA thresholds (10 q05, q07,
  q12, q14); CARO clause (xx) (06 q07).
- **Direct Tax** (`ca-fin-dt`): see the two priority items above; section 332 (04 q10); 44BB
  equivalent (09 q06); cess in under-reported income (06 q01, q02).
- **Indirect Tax** (`ca-fin-idt`): section 74A periods and penalties (06 q03, q04, q08, q10-q13);
  section 129 (06 q09); customs section 28 penalties (09 q12), section 47 interest (09 q09),
  warehousing period (09 q03), drawback 98% (09 q05, q10); e-invoice 30 days (05 q03); corporate
  guarantee 1% (03 q14); FTP status holders, EPCG, AA and DFIA details (10 q02, q08, q12, q14);
  insurance exemption (03 q02).
- **Integrated Business Solutions** (`ca-fin-ibs`): paper pattern verified from news sites, not the
  ICAI notice; 25.168% rate, RERA 70%, 110% stamp duty value, section 186 and 230(4) limits, CSR,
  CARO clauses, LODR related party threshold, startup ESOP deferral (05 q08), real estate GST
  (04 q07), healthcare exemption (07 q09), NBFC CRAR (03 lesson), fast-track merger classes
  (08 q12).

## After review

1. Fix or confirm each item in the track JSON.
2. Remove `"draft": true` from reviewed chapters.
3. Run `npm run validate`, then `npm run share` to refresh the docs and the setup and sync scripts.
