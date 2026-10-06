# Project: finguard
Summary: Real-time financial risk decisioning: a generalised additive model trained on 590,540 real card-not-present authorisations, with exact Shapley attributions, a measured control policy, and a hash-chained audit trail.
Code: https://github.com/aloniewski2/finguard
Live: https://aloniewski2.github.io/finguard/
Languages: Python, JavaScript, CSS
Last updated: 2026-08-23

# FinGuard — real-time financial risk and operations platform

A working risk-decisioning platform: it scores card authorisations in real time, explains every
decision exactly, applies a versioned control policy on top of the model, and gives an analyst a
console to work the resulting queue — with a tamper-evident audit trail behind every action.

Open the live console → (https://aloniewski2.github.io/finguard/) — runs entirely in your
browser. No backend, no account, nothing sent anywhere.

The model is trained on real fraud data: 590,540 card-not-present authorisations from the
IEEE-CIS / Vesta Payments dataset, spanning 182 days, 3.50% of them fraudulent. The console replays
a held-out slice of those transactions and scores them live.

## What it does

| | |

| Routes | a four-stage cascade — triage, known typologies, residual sweep, analyst triage — where every stage's contribution is measured and a stage that stops paying fails the build |
| Scores | 111 basis terms derived from 62 features across 15 analyst-facing concepts, computed causally from per-account history |
| Explains | exact Shapley attributions in closed form — they sum to the decision, they are not sampled |
| Adjudicates | 8 controls in a versioned policy document, each carrying its measured precision and lift |
| Answers | "what would have cleared this?" — verified by re-scoring, not estimated |
| Holds up | re-measured week by week across the held-out period — decay, calibration drift and feature drift, with unexplained drift failing the build |
| Records | hash-chained audit log; editing a past entry breaks every entry after it |
| Serves | FastAPI service with JWT auth, three-role RBAC, per-subject rate limiting, Prometheus metrics |

## Results on real held-out data

Validation is the last 30% of the calendar, not a random 30% of rows. A random split lets the
model validate against accounts whose later behaviour it has memorised and against fraud episodes
whose earlier transactions are in the training set. Production only ever sees the future, so
validation does too.

| Model | ROC AUC | PR AUC | Brier |

| Generalised additive model (deployed) | 0.855 | 0.402 | 0.0256 |
| Gradient boosting (same features, not deployed) | 0.904 | 0.509 | — |

Base rate on the validation window is 3.46%.

The boosted model is better and is not the one deployed. Its attributions would have to be
approximated by sampling, and they would not be identical for the same transaction twice. A decision
that declines someone's payment has to be explainable to the person it was declined for — exactly,
and reproducibly. That gap is the price of the explanation. It is written down here rather than
hidden, which is the point.

### What each band costs and catches

| Band | Action | Alerts per 10k | Precision | Recall | $ recall |

| LOW | allow | 4,000 | 7.5% | 87.0% | 86.3% |
| MEDIUM | monitor | 800 | 24.1% | 55.8% | 51.1% |
| HIGH | review | 200 | 56.5% | 32.7% | 21.6% |
| CRITICAL | block | 69 | 83.2% | 16.7% | 7.2% |

Reviewing 2% of traffic catches a third of all fraud at 57% precision. Blocking the top 0.7%
catches a sixth of it at 83% precision.

## How a decision moves

A flat decision path produces a band and nothing else. It cannot say which part of the system is
responsible for an alert, so it cannot say what any part is worth, so nothing in it can ever be
retired on evidence. Decisions run through four stages instead, and each one is measured against
the held-out window:

Together the funnel catches 57.7% of fraud and 60.6% of fraud dollars on 10.1% of traffic.
2,592 fraudulent authorisations worth $380,871 still slip through, which is recorded rather
than rounded away.

The cascade is not a compute optimisation, and does not claim to be. The deployed model is a
linear scorer that runs in single-digit milliseconds *in a browser* — there is no expensive stage
to defer. Every authorisation is scored in full wherever it stops, which is exactly what keeps an
exact attribution available for all of them, including the ones stage 2 stops. What the stages buy
is routing, per-stage accountability and a triage order.

It also never overrules the engine. `Cascade.run` annotates a decision; the band is the band the
model and the policy already produced. The first test in `test_cascade.py` runs every fixture case
through the cascade and asserts the decision is byte-identical before and after.

### Stage 1 found that rate and money disagree

| Segment | Volume | Fraud rate | Lift | Share of fraud dollars |

| C · credit | 4.0% | 18.80% | 5.44x | 7.8% |
| C · debit | 6.4% | 9.48% | 2.74x | 5.3% |
| W · credit | 12.3% | 3.88% | 1.12x | 35.5% |
| W · debit | 67.7% | 1.61% | 0.47x | 35.8% |

The highest-rate segment carries the least money and the lowest-rate segment carries the most. W
runs *below* base rate and holds 71.3% of every fraudulent dollar in the window. Routing on rate
alone would put the most attention where the least value is, so a lane is justified by either —
and `evaluate_cascade.py` fails the build if a segment is routed on neither.

A negative result from the same pass: "identity present" looked like independent signal at 2.77x,
but W is 100% identity-absent. It was product line in disguise, and was not used.

### The most precise queue is the least valuable one

Stage 4 orders by expected loss. On the held-out window, for the same top 1,000 cases:

| Ordering | Precision | Fraud dollars recovered |

| By score alone | 86.9% | $53,815 (5.6%) |
| By expected loss | 32.5% | $179,012 (18.5%) |

An analyst working the score-ordered queue is right almost every time about almost none of the
money. Both numbers are stamped into `cascade.json` and both are shown in the console, because the
trade is the point — not the winner.

## The part I got wrong, and what fixing it looked like

The first version of the control policy was written from domain intuition: impossible travel,
velocity bursts, new-device-plus-high-amount, card-testing sequences. All of it sounds right. Then
I measured each rule against the real labels:

| Control | Fire rate | Precision | Lift |

| Authorisation velocity burst | 0.91% | 1.1% | 0.3x |
| Unfamiliar device, amount above norm | 0.87% | 3.8% | 1.1x |
| Identity match checks failing | 4.60% | 3.5% | 1.0x |
| Card-testing probe sequence | 0.06% | 2.7% | 0.8x |

A lift of 1.0 means the control is indistinguishable from picking transactions at random. The
velocity rule was worse than random and got *further* from useful as the threshold rose — it was
selecting legitimate repeat shoppers. Four of my seven detection controls were generating alert
volume and no information.

So they were retired, with the measurement and the reasoning recorded in the policy document, and
the thresholds for what remained were chosen from sweeps rather than from intuition. Two of the
strongest controls in the book were found in the data rather than designed:

| Control | Fire rate | Precision | Lift |

| R-102 High card linkage with no billing address | 0.45% | 80.4% | 23.3x |
| R-101 Credential in circulation — retail product | 0.19% | 76.5% | 22.1x |
| R-103 No billing address on a material amount | 0.71% | 23.8% | 6.9x |

Neither is something I would have written down in advance. The linkage count on its own carries
almost no lift; it only becomes decisive in combination with the product line or a missing billing
address.

`ml/evaluate_policy.py` now regenerates those numbers and stamps them back into the policy
document, and exits non-zero if a non-exempt control falls below the 3x acceptance criterion. A
test asserts the same thing, so a control cannot quietly degrade into noise between releases.

## Does any of it hold up?

Every number above is an average over one 182-day file split once. That is the number you publish;
it is not the number that tells you whether the system still works in month six. A control at 23x
lift *on average* might be 40x in its first weeks and 3x in its last, and the average would hide it
completely — which is the specific way a fraud control fails in production: not with an error, but
by quietly becoming noise while its headline stays good.

`ml/evaluate_stability.py` walks the held-out period a week at a time and re-measures everything.
Only the held-out period: weekly metrics over the training window would measure memorisation, not
stability.

The model holds. PR AUC 0.415 across the first three weeks against 0.421 across the last three,
ROC AUC between 0.827 and 0.874 in every window, and no week where observed fraud ran more than 26%
away from what was predicted.

Two controls may not.

| Control | Early lift | Recent lift | 95% CI on recent | Fires | Verdict |

| R-102 | 22.9x | 23.4x | 21.8–24.5x | 158 | holds |
| R-101 | 23.9x | 19.2x | 15.9–21.7x | 61 | weakening |
| R-104 | 4.1x | 2.0x | 0.9–4.5x | 65 | inconclusive |
| R-105 | 4.7x | 2.8x | 1.3–5.7x | 56 | inconclusive |

R-104 and R-105 both roughly halve. At sixty fires a week the interval is wide enough to drive
through, so the honest answer is that this window cannot tell decay from noise — and the tool says
*inconclusive* rather than picking whichever side is more flattering. Calling them "holds" because
they clear a threshold would be the more comfortable reading and the wrong one.

### Drift has to be explained, not just detected

Inputs shift before outcomes do, so the same pass measures how far each feature has moved from what
the model was trained on. Six of 62 features moved materially, and they have exactly two causes:

| Feature | Peak PSI | Cause |

| `m_missing` | 0.512 | Data capture. The M1–M9 identity-match fields get progressively populated: the mean count of missing ones falls 6.80 → 3.82 across the six months. |
| `m_true_rate` | 0.153 | The other side of the same thing. |
| `acct_device_novelty` | 0.193 | Observation burn-in. |
| `acct_product_novelty` | 0.174 | Accounts accumulate history as the file progresses — mean transactions per account rises |
| `acct_email_novelty` | 0.170 | monotonically 0.663 → 1.356. Early in the window every account is new, so everything |
| `acct_txn_count` | 0.159 | looks novel. That is an artefact of where the file starts, not a change in the book. |

Neither cause is a defect, and `m_missing` at PSI 0.51 is a large shift that the model absorbed
without losing rank. So the gate does not forbid drift — the population is allowed to move. It
requires that drift be acknowledged in writing, with a cause and a ceiling: anything crossing
PSI 0.25 with no recorded explanation fails the build, and anything acknowledged at 0.65 that later
reaches 0.9 fails too, because the explanation on file was written for a smaller shift. It is the
same pattern the control policy already uses for lift exemptions — an exemption without a reason is
just a suppressed alarm.

The console renders all of this under Governance → Stability, verdicts included.

## Why the explanation is exact

For a linear model in log-odds space, the Shapley value of term *i* has a closed form:

No sampling, no background dataset, no approximation error, and the values sum exactly to the
decision. That property is what separates an explanation from a plausible story about one.

The catch is that a linear model cannot bend. Risk is not linear in distance — fifteen miles from
the billing address is nothing, three hundred is worth noticing, three thousand is barely worse than
fifteen hundred — and forcing one slope across all of it is most of why the boosted model was
winning. Adding a hinge `max(0, x - k)` at each knot lets the model bend at *k* while staying
perfectly additive: a generalised additive model, with a tree's shape flexibility and a
scorecard's exact attributions. That change alone moved PR AUC from 0.60 to 0.79 on the earlier
iteration of this pipeline.

The 111 basis terms are grouped back into 15 concepts for display, which is valid precisely because
Shapley values are additive — so the analyst sees "distance from billing address, +0.46" rather than
four spline pieces.

Building the cascade turned up two more, both found by measurement rather than by review.

The funnel disagreed with the queue it feeds. A control can escalate a case to a review band
without touching its score, so keying stage 3 off `score >= 92` counted cases as *cleared* while
they sat in the analyst queue. The measurement was approximating the policy instead of evaluating
it. Once it evaluated the real disposition per row, dollar recall went from 53.0% to 60.6% — the
funnel had been understating itself.

Priority multiplied money by a percentile. The score is an empirical quantile, so
`amount * score/100` is not an expected loss, and it ranked a large ordinary authorisation above a
small near-certain one: 7.7% precision in the top 1,000, against 32.5% once the calibrated
probability replaced the score. That one is in the table above.

Things I tried that did not work, kept here because negative results are results: I read the
top interactions out of the boosted model and encoded 14 of them explicitly as product terms. PR AUC
went *down*, from 0.402 to 0.398. They were removed rather than kept for the look of the thing.

## Two engines, pinned together

The console has no backend, so it re-implements scoring in JavaScript. An explanation that disagreed
with the one the API gives for the same transaction would be worse than no explanation, so the two
are pinned by a conformance fixture:

`ml/export_demo.py` writes the decisions the Python engine produces for 160 real held-out
transactions; the test asserts the JavaScript engine reproduces every one — probability, log-odds,
score, band, model band, controls fired, every attribution in order, the counterfactuals, and the
full cascade trace: segment, lane, the stage that stopped it, and each stage's reason. Change
one side and the test fails until you change the other.

## Layout

## Notes and limits

- The data is real; the deployment is a demo. The console replays a held-out slice of a public
  research dataset. No live payment traffic passes through anything here.
- The dataset is anonymised at source. Cards, addresses and devices are opaque identifiers, and
  there are no names anywhere in it.
- Account resolution is inferred. IEEE-CIS has no account column; `card1 + addr1 + (day - D1)`
  recovers a workable key, and it averages 2.7 transactions per account — thin enough that the
  behavioural features are weaker here than they would be on a real book with true account ids.
- The metrics are not comparable to the Kaggle leaderboard. That leaderboard scores a separate
  later period and the strong entries use all 339 anonymised `V*` columns plus heavy ensembling.
  This model deliberately drops the anonymous features, because a decision that cannot be named
  cannot be explained to a customer.
- The narrative generator is not a language model and says so when asked. Every sentence it
  produces is assembled from numbers already in the decision record.
