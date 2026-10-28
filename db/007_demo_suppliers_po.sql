-- 007: fictional supplier and purchase-order fixtures. No real supplier affiliation.
INSERT INTO ttc_suppliers(code,name,region,contact_email,demo) VALUES
('DEMO-SUP-001','Sample Fabric Supply Cooperative','Rizal','fabric.supplier@example.invalid',true),
('DEMO-SUP-002','Sample Trims and Findings','Metro Manila','trims.supplier@example.invalid',true),
('DEMO-SUP-003','Sample Packaging Materials','Laguna','packaging.supplier@example.invalid',true)
ON CONFLICT(code) DO NOTHING;
INSERT INTO ttc_purchase_orders(po_no,supplier_id,status,expected_date,notes,demo)
SELECT o.po_no,s.id,o.status,o.expected_date,o.notes,true
FROM (VALUES
('TTC-PO-DEMO-001','DEMO-SUP-001','issued','2026-11-03'::date,'Replenish navy pique fabric'),
('TTC-PO-DEMO-002','DEMO-SUP-002','issued','2026-11-05'::date,'Urgent zipper replenishment'),
('TTC-PO-DEMO-003','DEMO-SUP-003','draft','2026-11-10'::date,'Packaging stock forecast')
) AS o(po_no,supplier_code,status,expected_date,notes)
JOIN ttc_suppliers s ON s.code=o.supplier_code
ON CONFLICT(po_no) DO NOTHING;
INSERT INTO ttc_purchase_lines(po_id,stock_id,ordered_qty,received_qty)
SELECT p.id,i.id,x.ordered,0
FROM (VALUES ('TTC-PO-DEMO-001','FAB-PIQUE-NV',300),
             ('TTC-PO-DEMO-002','TRM-ZIP-20',600),
             ('TTC-PO-DEMO-003','PKG-BAG-01',1000)
) AS x(po_no,sku,ordered)
JOIN ttc_purchase_orders p ON p.po_no=x.po_no
JOIN ttc_stock_items i ON i.sku=x.sku
ON CONFLICT(po_id,stock_id) DO NOTHING;
