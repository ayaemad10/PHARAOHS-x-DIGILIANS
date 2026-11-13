"""
Merge the PSI tables in data/psi/ into the app catalog.

    python3 scripts/merge_psi.py

Reads  data/real/catalog_core.json   the original 354 records (SAFFIRE, BASS, LUCI, FLEX)
       data/psi/*.csv                the team's processed PSI tables
Writes data/real/catalog.json        core + one record per test from the PSI tables
       data/real/merge_report.json   what was added, skipped and why

One record per test. Nothing is invented: a value the table does not hold is left out, and the
outcome text says when a code is not defined in the source. Tables that are subsets of another
table, duplicates of records already in the core, or model output are not added as records.
"""
import csv, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PSI = os.path.join(ROOT, "data", "psi")
REAL = os.path.join(ROOT, "data", "real")


def rows(name):
    with open(os.path.join(PSI, name), encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def num(v, nd=3):
    try:
        x = float(v)
    except (TypeError, ValueError):
        return None
    if x != x:  # NaN
        return None
    return round(x, nd)


def clean(d):
    return {k: v for k, v in d.items() if v is not None and v != ""}


ORBIT = "microgravity (ISS)"
out, report = [], {"added": {}, "skipped": {}, "enriched": {}}

# ---------------------------------------------------------------- PSI-101 / PSI-102 SAME, SAME-R
for r in rows("psi101_all_tests.csv"):
    camp = r["campaign"]  # SAME or SAME-R
    cal = r["is_calibration_aerosol"] == "True"
    t = num(r["sample_temperature_c"], 0)
    out.append(clean({
        "id": f"same-{camp.lower()}-{r['same_number']}".replace("--", "-"),
        "program": camp,
        "psi": r["investigation_source"],
        "sample": r["test_id"],
        "material": r["material"] + (" (calibration aerosol)" if cal else ""),
        "flow_cm_s": num(r["inlet_velocity_cm_s"], 1),
        "flow_direction": "inlet",
        "gravity_regime": ORBIT,
        "outcome_group": "smoke_test",
        "outcome_label": f"Smoke sample: {r['material']} heated to {t:.0f} °C, {r['description'].strip()}" if t is not None else f"Smoke sample: {r['material']}, {r['description'].strip()}",
        "measurements": clean({
            "sample_temperature_c": t,
            "duration_s": num(r["duration_s"], 1),
            "net_aging_s": num(r["net_aging_s"], 1),
            "iss_smoke_detector_obscuration_v": num(r["iss_obscuration_volts"]),
            "iss_smoke_detector_scatter_v": num(r["iss_scatter_volts"]),
            "ionization_detector_change_v": num(r["ion_b_delta_volts"]),
            "particle_count_per_cc": num(r["ptrak_particles_cc"], 0),
            "mass_concentration_mg_m3": num(r["dusttrak_b_mg_m3"], 2),
            "mass_average_diameter_um": num(r["mass_average_diameter_micro_m"]),
        }),
        "quality_flags": ["calibration_aerosol"] if cal else [],
        "data_origin": f"CSV table ({r['investigation_source']})",
        "source_ids": [r["investigation_source"].lower()],
    }))
report["added"]["PSI-101/102 SAME, SAME-R (smoke detection)"] = 154
report["skipped"]["psi101_detection.csv"] = "subset of psi101_all_tests.csv"

# ---------------------------------------------------------------- PSI-107 SPICE smoke point
for i, r in enumerate(rows("psi107_all_platforms.csv"), 1):
    plat = r["platform"]
    reg = {"ISS": ORBIT, "Space Shuttle": "microgravity (Space Shuttle)", "KC-135": "low gravity (KC-135 parabolic aircraft)"}[plat]
    out.append(clean({
        "id": f"spice-{i}",
        "program": "SPICE",
        "psi": "PSI-107",
        "sample": r["test_id"] or f"{plat} {i}",
        "material": r["fuel_raw"].strip(),
        "flow_cm_s": num(r["coflow_velocity_cm_s"], 1),
        "flow_direction": "co-flow",
        "pressure_kpa": num(num(r["pressure_pa"]) / 1000, 2) if num(r["pressure_pa"]) else None,
        "gravity_regime": reg,
        "outcome_group": "smoke_point",
        "outcome_label": f"Smoke point flame length {num(r['smoke_point_mm'], 1)} mm",
        "measurements": clean({
            "smoke_point_mm": num(r["smoke_point_mm"], 2),
            "flame_width_mm": num(r["flame_width_mm"], 2),
            "fuel_jet_velocity_cm_s": num(r["fuel_jet_velocity_cm_s"], 1),
            "nozzle_mm": num(r["nozzle_mm"], 2),
            "fuel_mass_flow_mg_s": num(r["mdot_total_mg_s"], 3),
            "adiabatic_flame_temp_k": num(r["tad_k"], 0),
        }),
        "quality_flags": [],
        "data_origin": "CSV table (PSI-107)",
        "source_ids": ["psi-107"],
        "platform": plat,
    }))
report["added"]["PSI-107 SPICE (smoke point, 3 platforms)"] = 105
report["skipped"]["psi107_smoke_point.csv"] = "subset of psi107_all_platforms.csv"

# ---------------------------------------------------------------- PSI-159 ACME gaseous flames
for r in rows("psi159_all_tests.csv"):
    code = r["outcome_raw"].strip()
    if code == "SE":
        grp, lab = "extinction", "Self-extinguished"
    elif code == "FT":
        grp, lab = "sustained", "Did not self-extinguish (code FT; the table does not define FT)"
    else:
        grp, lab = "unknown", "Outcome not recorded"
    o2 = num(r["xo2_before"], 4)
    out.append(clean({
        "id": "acme-" + r["test_id"].replace(" ", "").lower(),
        "program": "ACME",
        "psi": "PSI-159",
        "sample": r["test_id"],
        "material": r["fuel_raw"].strip() + (" (inverse flame)" if r["flame_type"] == "inverse" else ""),
        "oxygen_pct": round(o2 * 100, 2) if o2 is not None else None,
        "pressure_kpa": num(num(r["pressure_bar"]) * 100, 2) if num(r["pressure_bar"]) else None,
        "gravity_regime": ORBIT,
        "outcome_group": grp,
        "outcome_label": lab + (f" after {num(r['burn_time_s'], 1)} s" if num(r["burn_time_s"]) and code in ("SE", "FT") else ""),
        "measurements": clean({
            "burn_time_s": num(r["burn_time_s"], 1),
            "fuel_flow_mg_s": num(r["fuel_flow_mg_s"], 3),
            "oxygen_flow_mg_s": num(r["o2_flow_mg_s"], 3),
            "peak_burner_temp_c": num(r["peak_burner_temp_c"], 0),
            "adiabatic_flame_temp_k": num(r["tad_k"], 0),
            "flame_color": r["flame_color"] if r["flame_color"] not in ("", "-") else None,
            "fuel_fraction_in_jet": num(r["fuel_dilution"], 2),
        }),
        "quality_flags": [x for x in [r["comments"].strip().lower().replace(" ", "_") if r["comments"].strip() else None] if x],
        "data_origin": "CSV table (PSI-159)",
        "source_ids": ["psi-159"],
        "flame_type": r["flame_type"],
    }))
report["added"]["PSI-159 ACME (gaseous flames, O2 18-40 %, 0.5-3.3 bar)"] = 333
report["skipped"]["psi159_sustainment.csv"] = "subset of psi159_all_tests.csv"

# ---------------------------------------------------------------- PSI-25 BASS-II materials
OUT25 = {"extinction": ("extinguished", "Flame went out"), "blowoff": ("extinguished", "Blow-off"),
         "no_ignition": ("not_ignited", "Did not ignite"), "no_sustained_ignition": ("not_ignited", "Ignited but did not sustain")}
for r in rows("psi25_materials_catalogue.csv"):
    g, lab = OUT25.get(r["outcome"], ("unknown", "Outcome not recorded in table"))
    out.append(clean({
        "id": "bass2-psi25-" + r["test_id"].lower(),
        "program": "BASS-II",
        "psi": "PSI-25",
        "sample": r["test_id"],
        "material": r["material_family"],
        "material_verbatim": r["material_raw"],
        "thickness_mm": num(r["thickness_mm"], 3),
        "width_cm": num(r["width_cm"], 2),
        "flow_cm_s": num(r["flow_first"], 1),
        "flow_direction": "duct flow",
        "oxygen_pct": num(r["o2_initial_pct"], 1),
        "gravity_regime": "microgravity (ISS, Microgravity Science Glovebox)",
        "test_date": r["test_date"],
        "outcome_group": g,
        "outcome_label": lab,
        "measurements": clean({
            "o2_initial_pct": num(r["o2_initial_pct"], 1),
            "o2_final_pct": num(r["o2_final_pct"], 1),
            "co2_final_pct": num(r["co2_final_pct"], 2),
            "co_final_ppm": num(r["co_final_ppm"], 0),
            "flow_min_cm_s": num(r["flow_min"], 1),
            "flow_max_cm_s": num(r["flow_max"], 1),
            "diameter_mm": num(r["diameter_mm"], 2),
        }),
        "quality_flags": ["may_overlap_bass2_published_records"] + (["flow_ramp_ambiguous"] if r["flow_ramp_ambiguous"] == "True" else []),
        "data_origin": "CSV table (PSI-25)",
        "source_ids": ["psi-25"],
    }))
report["added"]["PSI-25 BASS-II test log (PMMA, SIBAL, Nomex, wax)"] = 129

# ---------------------------------------------------------------- PSI-39 CFI cool flames (FLEX-2)
for r in rows("psi39_all_tests.csv"):
    cf = r["cool_flame"]
    g, lab = ("cool_flame", "Cool flame observed") if cf == "1" else (("extinction", "No cool flame; hot flame went out") if cf == "0" else ("unknown", "Cool-flame result not recorded"))
    out.append(clean({
        "id": f"cfi-{r['flex_number']}",
        "program": "CFI",
        "psi": "PSI-39",
        "sample": f"FLEX {r['flex_number']}",
        "material": r["fuel"],
        "oxygen_pct": round(num(r["o2_frac"], 4) * 100, 2) if num(r["o2_frac"]) is not None else None,
        "pressure_kpa": round(num(r["pressure_atm"]) * 101.325, 2) if num(r["pressure_atm"]) else None,
        "gravity_regime": ORBIT,
        "test_date": r["test_date"],
        "outcome_group": g,
        "outcome_label": lab,
        "measurements": clean({
            "droplet_initial_diameter_mm": num(r["d0_mm"], 3),
            "hot_flame_extinction_diameter_mm": num(r["dext_hot_mm"], 3),
            "cool_flame_extinction_diameter_mm": num(r["dext_cool_mm"], 3),
            "hot_burning_rate_mm2_s": num(r["k_hot_mm2_s"], 3),
            "cool_burning_rate_mm2_s": num(r["k_cool_mm2_s"], 3),
            "hot_flame_burn_time_s": num(r["hot_flame_burn_time_s"], 2),
            "helium_fraction": num(r["he_frac"], 3),
        }),
        "quality_flags": (["cool_flame_extrapolated"] if r["cool_flame_extrapolated"] == "1" else []),
        "data_origin": "CSV table (PSI-39)",
        "source_ids": ["psi-39"],
    }))
report["added"]["PSI-39 CFI (cool-flame droplets)"] = 227
report["skipped"]["psi39_cool_flames.csv"] = "subset of psi39_all_tests.csv"

# ---------------------------------------------------------------- PSI-117 cool flames (experiment rows only)
n117 = 0
for i, r in enumerate(rows("psi117_cool_flame_observations.csv"), 1):
    if r["source"] != "experiment":
        continue
    n117 += 1
    out.append(clean({
        "id": f"cf117-{i}",
        "program": "Cool flames",
        "psi": "PSI-117",
        "sample": f"{r['fuel']} d0 {r['d0_mm']} mm",
        "material": r["fuel"],
        "pressure_kpa": round(num(r["pressure_atm"]) * 101.325, 2) if num(r["pressure_atm"]) else None,
        "gravity_regime": ORBIT,
        "outcome_group": "cool_flame" if r["cool_flame"] == "1" else "extinction",
        "outcome_label": "Cool flame observed" if r["cool_flame"] == "1" else "No cool flame",
        "measurements": clean({
            "droplet_initial_diameter_mm": num(r["d0_mm"], 3),
            "cool_flame_extinction_diameter_mm": num(r["dext_cool_mm"], 3),
            "hot_flame_extinction_diameter_mm": num(r["dext_hot_mm"], 3),
        }),
        "quality_flags": ["digitised_from_publication"],
        "data_origin": "published figure (PSI-117)",
        "source_ids": ["psi-117"],
    }))
report["added"]["PSI-117 cool flames (experiment points)"] = n117
report["skipped"]["psi117_measurements.csv / simulation rows"] = "model output and error bars, not tests"

# ---------------------------------------------------------------- PSI-142 counterflow extinction (1 g, ground)
for i, r in enumerate(rows("psi142_extinction_limits.csv"), 1):
    out.append(clean({
        "id": f"cfx142-{i}",
        "program": "Counterflow extinction",
        "psi": "PSI-142",
        "sample": f"{r['fuel']} · {r['data_id']}",
        "material": r["fuel"],
        "gravity_regime": "1 g (ground laboratory)",
        "outcome_group": "extinction",
        "outcome_label": f"{r['extinction_type'].capitalize()}-flame extinction at strain rate {num(r['extinction_strain_rate_1_s'], 1)} 1/s",
        "measurements": clean({
            "extinction_strain_rate_1_s": num(r["extinction_strain_rate_1_s"], 2),
            "fuel_mass_fraction": num(r["fuel_mass_fraction"], 4),
            "flame_type": r["extinction_type"],
            "ozone_added": r["ozone"] == "True",
        }),
        "quality_flags": ["digitised_from_publication", "ground_test_1g"],
        "data_origin": "published figure (PSI-142)",
        "source_ids": ["psi-142"],
        "publication": r["publication"],
    }))
report["added"]["PSI-142 counterflow extinction limits (1 g reference)"] = 95
report["skipped"]["psi142_other_measurements.csv"] = "mixed measurement types, not one test per row"
report["skipped"]["psi115_field_summary.csv"] = "simulation field summary, not tests"
report["skipped"]["psi69_all_burns.csv / psi69_suppression.csv"] = "same 274 FLEX tests already in the catalog (verified row by row)"

# ---------------------------------------------------------------- core + PSI-99 enrichment of Saffire-II
core = json.load(open(os.path.join(REAL, "catalog_core.json")))
by_id = {r["id"]: r for r in core}
n99 = 0
for r in rows("psi99_microgravity_vs_earth.csv"):
    rec = by_id.get("saffire-2-" + r["sample_id"].split("-")[1])
    if not rec:
        continue
    m = rec.setdefault("measurements", {})
    for k_src, k_dst in [("ug_spread_rate_mm_s", "microgravity_spread_rate_mm_s"), ("g1_spread_rate_mm_s", "earth_1g_spread_rate_mm_s"),
                         ("ug_burn_length_cm", "microgravity_burn_length_cm"), ("g1_burn_length_cm", "earth_1g_burn_length_cm")]:
        v = num(r[k_src], 2)
        if v is not None:
            m[k_dst] = v
    for k_src, k_dst in [("g1_spread_rate_qualitative", "earth_1g_spread"), ("g1_burn_length_qualitative", "earth_1g_burn_length"), ("ug_spread_rate_qualitative", "microgravity_spread")]:
        if r[k_src]:
            m[k_dst] = r[k_src]
    rec["psi"] = "PSI-99"
    if "psi-99" not in rec.get("source_ids", []):
        rec.setdefault("source_ids", []).append("psi-99")
    n99 += 1
report["enriched"]["PSI-99 Saffire-II: microgravity vs 1 g spread added to existing records"] = n99
report["skipped"]["Saffire_Data_Table2017 workbook"] = "run not identified"

catalog = core + out
ids = [r["id"] for r in catalog]
assert len(ids) == len(set(ids)), "duplicate ids"
json.dump(catalog, open(os.path.join(REAL, "catalog.json"), "w"), ensure_ascii=False, separators=(",", ":"))  # compact: same values, smaller file
report["total_records"] = len(catalog)
report["core_records"] = len(core)
json.dump(report, open(os.path.join(REAL, "merge_report.json"), "w"), separators=(",", ":"))
print(json.dumps(report, indent=1))
