/**
 * Readable titles for the mission-specific findings in data/real/insights.json, whose own "title"
 * field is the finding id with the dashes removed ("sibal 10 vs 5"). The statements themselves are
 * quoted from the sources and are not changed.
 */
export const MISSION_FINDING_TITLES = {
  "low-flow-sensitivity": "Flames are most sensitive to air speeds of 0–5 cm/s",
  "dim-blue-low-flow": "Below 1 cm/s flames turn dim blue but can burn for a long time",
  "flames-survive-below-1": "Flames survived in air flow under 1 cm/s",
  "sibal-quench-speeds": "SIBAL fabric flames quench between 1 and 5 cm/s",
  "sibal-spread-trends": "Narrower samples, slower flow and less oxygen slow the spread",
  "sibal-10-vs-5": "At 5 cm/s the flame is shorter and spreads more slowly than at 10 cm/s",
  "sibal-10-duration": "At 10 cm/s a sample burned out in about 40 s",
  "sibal-5-duration": "At 5 cm/s burning the whole sample took more than 60 s",
  "pmma-rod-limits": "Acrylic rods: blow-off and quenching limits measured at several oxygen levels",
  "confinement-small-gap": "Baffles about 1 cm apart stop ignition or put the flame out",
  "saffire-vs-bass": "Large SAFFIRE flames spread more slowly than small BASS flames",
  "bass-duct": "BASS-II ran in the ISS Microgravity Science Glovebox",
  "bass-duct-size": "The BASS flow duct is 7.6 × 7.6 × 17 cm",
  "hw-duct": "The duct was first built for gas-jet flame studies",
  "hw-fan": "A variable-speed fan blew the air through the duct",
  "hw-straightener": "A flow straightener and screen removed swirl",
  "hw-radiometer": "A thermopile radiometer watched the flame",
  "hw-still-camera": "A colour still camera photographed each burn",
  "hw-video": "The video overlay recorded flow, fan and radiometer readings",
  "hw-igniter": "A hot-wire coil ignited the samples",
  "hw-samples": "Flat samples were 1 or 2 cm wide",
  "hw-exit": "A copper plate and screen at the exit took up heat and soot",
  "hw-nitrogen": "Nitrogen was added to lower the oxygen in the glovebox",
  "saffire-first-large-fire": "The first large fire set on purpose in an orbiting spacecraft",
  "saffire-steady-wide-flame": "A wide sample burned with a steady flame in concurrent flow",
  "saffire-nomex-not-ignited": "The Nomex fabric did not ignite despite heavy heating",
  "saffire-thick-fuel-pinned": "Thick fuel: flame behaviour reported in SAFFIRE-IV/V",
  "saffire-flame-jumped-gap": "Flame crossing a gap: reported in SAFFIRE-IV/V",
  "saffire-alarm-981-s": "Alarm timing: reported in SAFFIRE-VI",
  "saffire-co-co2-limits": "CO and CO₂ levels: reported in SAFFIRE-VI",
  "saffire-practical-scale-kw": "Fire size in kilowatts: reported in SAFFIRE-VI",
  "flex-loi-lower": "Droplet fuels went out at slightly less oxygen than expected",
  "flex-test-conditions": "FLEX droplets: 2–5 mm, 0.70–3.05 atm, diluted air",
  "acme-spherical-flames": "Without buoyancy, gas flames become spherical",
  "low-g-burns-lower-o2": "Some materials burn at lower oxygen in low gravity than on Earth",
  "luci-first-lunar": "The first long burns (over 25 s) in simulated lunar gravity",
  "luci-fm2": "LUCI prepares burn tests on the Moon itself (FM2)",
  "sibal-lunar-downward": "In lunar gravity SIBAL fabric burns only downward",
  "exploration-atmosphere": "NASA's proposed exploration air: 56.5 kPa, 34% O₂",
};

export const titleForFinding = (f) => MISSION_FINDING_TITLES[f.id] ?? f.title;
