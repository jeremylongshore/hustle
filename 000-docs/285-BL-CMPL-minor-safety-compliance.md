# Hustle — Minor Safety & Compliance Checklist (2026-09)

**Status:** Research snapshot, 2026-09-18. **This is not legal advice.** Counsel who specialize in youth privacy must review it before P1 closes and before we submit to the app stores (281).
**How to read it:** **LAW** means a statute, regulation, or store rule. **BP** means best practice that we are choosing as a product standard. Items marked ⚠ are recent or still moving, so re-verify them.

---

## 1. COPPA (users under 13, and any data about them)

- **LAW:** the amended COPPA Rule is in full effect; the compliance deadline was **2026-04-22**. [Finnegan](https://www.finnegan.com/en/insights/articles/coppas-amended-rule-is-now-in-full-effect-what-operators-need-to-know.html) · [16 CFR 312](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312)
- **LAW:** obtain verifiable parental consent before collecting a child's personal information, using an FTC-recognized method. [FTC VPC](https://www.ftc.gov/business-guidance/privacy-security/verifiable-parental-consent-childrens-online-privacy-rule)
- **LAW:** get **separate** consent before disclosing a child's data to third parties. This bears on Claude API calls and on any analytics. [Davis Polk](https://www.davispolk.com/insights/client-update/ftc-prioritizes-coppa-enforcement-new-compliance-obligations-take-effect)
- **LAW:** data minimization, a written retention policy, parent review and deletion, and a written information-security program.
- **Hustle design:** the parent is the account holder. Athlete profiles are created under parent consent. AI features for any athlete under 13 stay off until the parent separately consents.
- ⚠ COPPA 2.0 (raising the protected age to under 17 and banning targeted ads to minors) passed the Senate in 2026 and is pending in the House. **We design as if it applies.**

## 2. Teens 13–17: state laws

- ⚠ **App Store Accountability Acts:**
  - Utah: compliance pushed to 2027-05-06. [Alston](https://www.alstonprivacy.com/challenge-to-utahs-app-store-accountability-act-voluntarily-dismissed-following-statutory-amendments)
  - Louisiana: 2027-07-01, and it has **no developer safe harbor**. [Alston](https://www.alstonprivacy.com/louisiana-delays-app-store-accountability-effective-date-to-july-2027) · [Bass Berry](https://www.bassberry.com/news/apps-and-minors-new-compliance-frontiers-and-risks-in-louisiana-utah-and-texas)
  - Texas: effective 2026-01-01 but **currently enjoined**. [O'Melveny](https://www.omm.com/insights/alerts-publications/texas-app-store-accountability-act-ushers-in-sweeping-age-verification-mandates)
  - All three mean consuming store age signals and honoring parental consent for downloads and purchases. [FPF chart](https://fpf.org/wp-content/uploads/2026/06/FPF-Legislation-TX-UT-LA-App-Store-Accountability-Act-Comparison-Chart.pdf)
- ⚠ **California Age-Appropriate Design Code:** parts were upheld by the Ninth Circuit, and it is expected to apply in 2027. It requires high-privacy defaults and no dark patterns or design that harms well-being. [Loeb](https://www.loeb.com/en/insights/passle/2026/03/ninth-circuit-rules-parts-of-california-ageappropriate-design-code-are-effective-and-enforceable)
- **Hustle design:** high-privacy defaults (profiles private, boards off), no streak-guilt dark patterns, and overtraining nudges.

## 3. App stores

- **LAW (store):** use the Apple **Declared Age Range API** and the **Google Play Age Signals API**, and handle every response state. ⚠ Check the deadlines by region and state. [Apple](https://developer.apple.com/news/?id=f5zj08ey) · [Google](https://developer.android.com/google/play/age-signals/use-age-signals-api)
- **LAW (store):** Apple 1.2 requirements for user-generated content: filtering, report, block, and published contact info. [Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- **LAW (store):** in-app account deletion (5.1.1(v)) and accurate privacy and Data safety labels.
- **LAW (store):** answer the updated age-rating questionnaire (13+/16+/18+).

## 4. Video uploads (P4, the recruiting reel)

- **LAW:** providers that learn of apparent child sexual abuse material (CSAM) must report it to the **NCMEC CyberTipline**. Preservation obligations were extended under the REPORT Act. [18 USC 2258A](https://uscode.house.gov/view.xhtml?req=granuleid%3AUSC-prelim-title18-section2258A) · [REPORT Act](https://en.wikipedia.org/wiki/REPORT_Act)
- **BP:** run automated moderation and CSAM hash-matching **before** a video is published. Candidate vendor: Hive. ⚠ AWS Rekognition video moderation reportedly closed to new customers in 2026. [Mixpeek](https://mixpeek.com/curated-lists/best-video-moderation-tools)
- **BP:** encrypt videos at rest, keep them in object storage (not SQLite), delete them on parent request, and write a moderation and reporting runbook.
- **BP (our choice):** the parent approves each clip before it becomes visible to anyone outside the family. A per-upload consent is *not* clearly required by COPPA for teens, but it is our standard.

## 5. Public recruiting profiles

- **BP:** a profile is never public without parent approval. Visibility levels: private → verified recruiters only → public link.
- **BP:** never show a home address, school location, athlete phone or email, social handles, or real-time location.
- **BP:** verify recruiters (an .edu domain matched against the program's staff directory, plus manual review), and give them a "Verified recruiter" badge.
- **BP:** show honest engagement only (who viewed, when). No inflated counts.

## 6. Messaging and adult–minor contact

- **BP (non-negotiable for us):** **no private messaging between an adult and a minor.** Recruiter and trainer contact goes to the **parent's inbox**. The athlete sees messages after the parent approves them.
- **BP:** keep an audit log of all contact, give parents a view of who reached out, and add block and report tools.
- **BP:** no messaging between athletes in v1.
- Reference: U.S. Center for SafeSport, MAAPP (the Minor Athlete Abuse Prevention Policies). These bind National Governing Body members. They are the right standard even where they don't legally apply to an app. [MAAPP](https://maapp.uscenterforsafesport.org/)
- **BP:** an in-app "Report abuse" button that routes to Hustle and links to SafeSport's reporting channel.

## 7. NCAA

- **Rules:** contact-period rules restrict college **coaches**, not athletes. Athletes can reach out whenever they like. [SportsRecruits](https://sportsrecruits.com/resources/contacting-college-coaches/ncaa-rules-and-regulations)
- ⚠ **Recruiting and scouting services:** D-I and D-II institutions may only pay for services approved by the NCAA's Enforcement Certification and Approvals Group (ECAG). **Keeping recruiter access free avoids that issue.** Get a legal read before selling anything on the recruiter side. [NCAA](https://www.ncaa.org/sports/2020/11/24/institutional-responsibilities-regarding-recruiting-scouting-service-approvals.aspx)

## 8. Competition and gamification

- **BP:** leaderboards are opt-in, age-banded, limited to invited groups, and show their formula. A parent can hide them. Badges reward effort and improvement. No national public rankings.

## 9. Records and transparency

- **LAW/BP:** a clear privacy policy covering what we collect, consent methods, retention, deletion, CSAM reporting, and recruiter verification.
- **BP:** honor parent deletion requests within 30 days.
- **BP:** keep an audit trail of consents, uploads, moderation actions, and contact.

---

## Map to the roadmap (281)

| Phase | Items it must satisfy |
|---|---|
| P1 | §1 consent flow · §2 defaults · §3 deletion · §9 policy and counsel review |
| P3 | §8 (badges and streaks in Train) |
| P4 | §4 video · §5 profiles · §6 messaging · §7 NCAA read |
| P5 | §8 leaderboards |
| P6 | §3 age-signal APIs, labels, age rating |
