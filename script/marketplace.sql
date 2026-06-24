-- Función de normalización para la búsqueda del marketplace (Klikea).
-- Pasa el texto a minúsculas y le quita las tildes/acentos más comunes, para que el
-- buscador encuentre por coincidencia sin distinguir mayúsculas ni tildes.
--
-- La aplicación intenta crearla sola al arrancar (MarketplaceDbInitializer). Este script
-- es el respaldo manual: ejecutarlo una vez si el arranque no tuvo privilegios.
--   psql -U postgres -d ecommerce -f script/marketplace.sql

CREATE OR REPLACE FUNCTION kilikea_norm(txt text) RETURNS text AS $func$
  SELECT lower(translate(coalesce(txt, ''),
    'ÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑáàäâãéèëêíìïîóòöôõúùüûñ',
    'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun'));
$func$ LANGUAGE sql IMMUTABLE;
