# Kiesgeurig Meta-catalogusfeed

Dagelijkse CSV-feed voor de Meta-catalogus van kiesgeurig.nl, gebouwd uit de openbare Shopify `products.json`.

- Feed-URL: https://gijs-blend.github.io/kiesgeurig-meta-feed/meta-feed.csv
- ID-formaat `shopify_ZZ_<productId>_<variantId>`, gelijk aan de content_ids van de Meta-pixel (custom pixel in Shopify) en aan Merchant Center.
- Producten zonder afbeelding worden overgeslagen (Meta weigert ze).
- Bij minder dan 1000 producten stopt het script, zodat een storing de feed niet leegmaakt.
- Handmatig draaien: tabblad Actions > "Meta-feed bijwerken" > Run workflow.

Beheer: Blend Marketing & Media.
