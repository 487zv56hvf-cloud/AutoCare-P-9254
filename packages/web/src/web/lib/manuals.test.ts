import { expect, test } from "bun:test";
import { cleanManualUrl, linksOf, addLink, removeLink, manualFor, manualSearches, LINK_MAX } from "./manuals";
import { computeAll, type Vehicle } from "./carcare";

const car = (o: Partial<Vehicle> = {}): Vehicle => ({
  id: "car-1", vin: "", make: "Honda", model: "Accord", year: 2006, cls: "mainstream",
  oilType: "semi", driving: "city", odometer: 120000,
  last: { oil: 115000, brakes: null, tires: 90000 }, log: [], ...o,
});

test("refuses dangerous or broken URLs", () => {
  for (const bad of ["", "   ", "javascript:alert(1)", "data:text/html,x", "file:///etc/passwd", "ftp://x.com/a", "http://localhost", "5", "192.168.1.1", "not a url", "https://" + "a".repeat(600) + ".com"])
    expect(cleanManualUrl(bad)).toBeNull();
  expect(cleanManualUrl("honda.com/manual.pdf")).toBe("https://honda.com/manual.pdf");
  expect(cleanManualUrl(" https://x.com/a b ")).toBe("https://x.com/a%20b");
});

test("add / duplicate / full / remove", () => {
  let v = car();
  const r = addLink(v, "  Manual  ", "https://owners.honda.com/m.pdf", "2026-11-18");
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  v = r.car;
  expect(linksOf(v)).toEqual([{ label: "Manual", url: "https://owners.honda.com/m.pdf", added: "2026-11-18" }]);
  expect(addLink(v, "", "owners.honda.com/m.pdf", "x")).toEqual({ ok: false, reason: "duplicate" });
  for (let i = 0; i < LINK_MAX - 1; i++) {
    const n = addLink(v, "", `https://a${i}.com`, "x");
    if (n.ok) v = n.car;
  }
  expect(linksOf(v).length).toBe(LINK_MAX);
  expect(addLink(v, "", "https://overflow.com", "x")).toEqual({ ok: false, reason: "full" });
  v = removeLink(v, "https://owners.honda.com/m.pdf");
  expect(linksOf(v).length).toBe(LINK_MAX - 1);
});

test("garbage saved data never crashes", () => {
  const bad = [null, 1, "x", { url: 5 }, { url: "javascript:1" }, { url: "https://ok.com", label: 9 }, { url: "https://ok.com" }];
  const v = { ...car(), manuals: bad } as unknown as Vehicle;
  expect(linksOf(v)).toEqual([{ url: "https://ok.com/", label: "", added: "" }]);
  expect(linksOf({ ...car(), manuals: "nope" } as unknown as Vehicle)).toEqual([]);
});

test("bundled manual matching", () => {
  expect(manualFor(car())?.file).toBe("/manuals/honda-accord-2006.pdf");
  expect(manualFor(car({ make: " HONDA ", model: "Accord EX", year: null }))).not.toBeNull();
  expect(manualFor(car({ year: 2015 }))).toBeNull();
  expect(manualFor(car({ make: "Chevrolet", model: "Cruze", year: 2016 }))?.file).toContain("cruze");
  expect(manualSearches(car({ model: "C&A #1" })).pdf).toContain(encodeURIComponent("C&A #1"));
});

test("perf: overview math for 500 cars stays fast", () => {
  const cars = Array.from({ length: 500 }, (_, i) =>
    car({ id: `c${i}`, odometer: 1000 + i * 731, last: { oil: i % 3 ? i * 700 : null, brakes: i * 500, tires: null }, log: [{ date: "2026-01-01", km: i * 600 }, { date: "2026-11-01", km: 1000 + i * 731 }] }),
  );
  const t0 = performance.now();
  for (let run = 0; run < 10; run++) cars.map(computeAll);
  const per = (performance.now() - t0) / 10;
  console.log(`computeAll x500: ${per.toFixed(2)}ms per render`);
  expect(per).toBeLessThan(50);
});
