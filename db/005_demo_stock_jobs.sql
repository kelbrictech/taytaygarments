-- 005: idempotent, entirely fictional showroom / inventory demo records.
INSERT INTO ttc_stock_items(sku,description,category,unit,location,on_hand,reorder_point,demo) VALUES
('FAB-PIQUE-NV','Cotton-blend pique — navy','Fabric','meters','Fabric bay A',420,180,true),
('FAB-PIQUE-WH','Cotton-blend pique — white','Fabric','meters','Fabric bay A',125,180,true),
('FAB-TWILL-DG','Premium twill — deep green','Fabric','meters','Fabric bay B',280,140,true),
('FAB-COT-SKY','Cotton jersey — sky blue','Fabric','meters','Fabric bay A',320,120,true),
('TRM-BTN-12','12 mm shirt buttons','Trims','pcs','Trims bin 2',1850,800,true),
('TRM-ZIP-20','20 cm zipper — black','Trims','pcs','Trims bin 4',165,200,true),
('TRM-THREAD-WH','Polyester thread — white','Trims','spools','Trims bin 1',90,35,true),
('PKG-BAG-01','Recycled individual garment bags','Packaging','pcs','Packing room',650,250,true),
('FIN-POLO-NV','Campus Signature Polo — navy (demo)','Finished goods','pcs','Finished bay',80,30,true),
('FIN-BLAZER-CH','Scholar Blazer — charcoal (demo)','Finished goods','pcs','Finished bay',15,20,true)
ON CONFLICT(sku) DO NOTHING;
INSERT INTO ttc_jobs(code,title,department,location,arrangement,summary,published,demo) VALUES
('DEMO-JOB-001','Sample Sewing Technician','Production','Taytay, Rizal','On-site','Demonstration vacancy to illustrate the careers portal. No recruitment is currently open.',true,true),
('DEMO-JOB-002','Sample Quality Control Associate','Quality Assurance','Taytay, Rizal','On-site','Demonstration vacancy to illustrate garment quality procedures. No recruitment is currently open.',true,true),
('DEMO-JOB-003','Sample Merchandising Coordinator','Merchandising','Taytay, Rizal','Hybrid','Demonstration vacancy to show office roles. No recruitment is currently open.',true,true)
ON CONFLICT(code) DO NOTHING;
INSERT INTO ttc_content_pages(slug,title,body,published) VALUES
('taytay-hub','Taytay · Garments Capital of the Philippines','Taytay, Rizal is officially described by its municipality as the Garments Capital of the Philippines. Explore the town’s garment-making legacy and the makers, sellers and supply-chain businesses behind it.',true),
('careers','Careers at Taytay Textile Co.','Explore sample positions and the kinds of skills that move the garment sector forward. These listings are for demonstration; recruitment has not been announced.',true),
('homepage-note','Made in Taytay, Rizal','This development website illustrates our proposed catalog, buyer services and operations workflows. Product availability and production capacity have not been verified.',true)
ON CONFLICT(slug) DO NOTHING;
