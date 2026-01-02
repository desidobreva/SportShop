import { create } from "xmlbuilder2";

export function buildCatalogXml(departments) {
  const root = create({ version: "1.0", encoding: "UTF-8" })
    .ele("sportShop");

  for (const dep of departments) {
    const depEl = root.ele("department", { name: dep.name });
    for (const cat of dep.categories) {
      const catEl = depEl.ele("category", { name: cat.name });
      for (const p of cat.products) {
        const prod = catEl.ele("product");
        prod.ele("id").txt(String(p.id));
        prod.ele("name").txt(p.name);
        prod.ele("brand").txt(p.brand);
        prod.ele("price").txt(String(p.price));
        prod.ele("color").txt(p.color);
        prod.ele("size").txt(p.size_label);
        prod.ele("stock").txt(String(p.stock));
      }
    }
  }

  return root.end({ prettyPrint: true });
}
