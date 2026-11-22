$rows = @()
# calzado
$calzado = @(
 @{n=1;d='Zapatilla deportiva roja sobre fondo claro';s='https://unsplash.com/photos/164_6wVEHfI';o='revolt-164_6wVEHfI-unsplash.jpg'},
 @{n=2;d='Zapatilla casual marrón en fondo neutro';s='https://unsplash.com/photos/j1GiPlvSGWI';o='usama-akram-j1GiPlvSGWI-unsplash.jpg'},
 @{n=3;d='Zapatilla deportiva naranja en vista lateral';s='https://unsplash.com/photos/JM-qKEd1GMI';o='luis-felipe-lins-JM-qKEd1GMI-unsplash.jpg'},
 @{n=4;d='Zapatilla roja clásica en composición de estudio';s='https://unsplash.com/photos/a-QH9MAAVNI';o='paul-gaudriault-a-QH9MAAVNI-unsplash.jpg'},
 @{n=5;d='Par de zapatillas coloridas sobre fondo azul';s='https://unsplash.com/photos/dwKiHoqqxk8';o='irene-kredenets-dwKiHoqqxk8-unsplash.jpg'},
 @{n=6;d='Zapatilla deportiva multicolor en fondo claro';s='https://unsplash.com/photos/jvoZ-Aux9aw';o='ryan-plomp-jvoZ-Aux9aw-unsplash.jpg'},
 @{n=7;d='Zapatilla deportiva negra con suela clara';s='https://unsplash.com/photos/PqbL_mxmaUE';o='usama-akram-PqbL_mxmaUE-unsplash.jpg'},
 @{n=8;d='Zapatilla negra de entrenamiento en fondo oscuro';s='https://unsplash.com/photos/kP6knT7tjn4';o='usama-akram-kP6knT7tjn4-unsplash.jpg'},
 @{n=9;d='Zapatilla verde deportiva en vista de perfil';s='https://unsplash.com/photos/DMl5gG0yWWY';o='malvestida-DMl5gG0yWWY-unsplash.jpg'},
 @{n=10;d='Zapatillas rosadas sobre fondo pastel';s='https://unsplash.com/photos/1BI-ar91C7U';o='maksim-larin-1BI-ar91C7U-unsplash.jpg'},
 @{n=11;d='Zapatilla negra con detalles dorados';s='https://unsplash.com/photos/LxVxPA1LOVM';o='iman-ameli-LxVxPA1LOVM-unsplash.jpg'},
 @{n=12;d='Zapatillas claras en fondo minimalista';s='https://unsplash.com/photos/DMlYOlzddDo';o='revendo-DMlYOlzddDo-unsplash.jpg'},
 @{n=13;d='Zapatilla blanca con acento de color';s='https://unsplash.com/photos/76w_eDO1u1E';o='revendo-76w_eDO1u1E-unsplash.jpg'},
 @{n=14;d='Zapatillas blancas en vista superior';s='https://unsplash.com/photos/pu-PgXMI30I';o='xavier-teo-pu-PgXMI30I-unsplash.jpg'},
 @{n=15;d='Zapatillas grises de running sobre fondo claro';s='https://unsplash.com/photos/1BM4kWZl4iU';o='nathan-dumlao-1BM4kWZl4iU-unsplash.jpg'},
 @{n=16;d='Zapatilla deportiva blanca en estudio';s='https://unsplash.com/photos/_Tndmo0mqSQ';o='usama-akram-_Tndmo0mqSQ-unsplash.jpg'},
 @{n=17;d='Zapatillas rojas deportivas en fondo oscuro';s='https://unsplash.com/photos/SxAXphIPWeg';o='paul-gaudriault-SxAXphIPWeg-unsplash.jpg'},
 @{n=18;d='Zapatillas blancas de estilo casual';s='https://unsplash.com/photos/E-0ON3VGrBc';o='lefteris-kallergis-E-0ON3VGrBc-unsplash.jpg'},
 @{n=19;d='Zapatilla de running en ambiente exterior';s='https://unsplash.com/photos/JzJSybPFb3s';o='jakob-owens-JzJSybPFb3s-unsplash.jpg'},
 @{n=20;d='Zapatos deportivos azules sobre fondo claro';s='https://unsplash.com/photos/5raPrOhbKQo';o='mohammad-metri-5raPrOhbKQo-unsplash.jpg'}
)
foreach($i in $calzado){ $rows += [pscustomobject]@{category_slug='calzado';candidate_number=$i.n;candidate_file=("src/assets/images/catalog-candidates/calzado/candidate-{0:00}.webp" -f $i.n);description=$i.d;source_url=$i.s;license='Unsplash License (https://unsplash.com/license) | verificación documental pendiente por archivo';original_filename=$i.o;optimized_filename=("candidate-{0:00}.webp" -f $i.n);reviewer_approval='PENDING'} }
$imp = @(
 @{n=1;d='Persona levantando barra en gimnasio';s='https://unsplash.com/photos/WvDYdXDzkhs';o='victor-freitas-WvDYdXDzkhs-unsplash.jpg'},
 @{n=2;d='Mancuernas organizadas en rack de gimnasio';s='https://unsplash.com/photos/CQfNt66ttZM';o='samuel-girven-CQfNt66ttZM-unsplash.jpg'},
 @{n=3;d='Sala de entrenamiento con mancuernas y equipos';s='https://unsplash.com/photos/2qWfJz4eSDA';o='danielle-cerullo-2qWfJz4eSDA-unsplash.jpg'},
 @{n=4;d='Kettlebell en piso de gimnasio';s='https://unsplash.com/photos/FodEsaNZs48';o='alora-griffiths-FodEsaNZs48-unsplash.jpg'},
 @{n=5;d='Mancuerna y banda elástica en tapete de entrenamiento';s='https://unsplash.com/photos/IZOAOjvwhaM';o='kelly-sikkema-IZOAOjvwhaM-unsplash.jpg'},
 @{n=6;d='Fila de mancuernas en rack metálico';s='https://unsplash.com/photos/VJ2s0c20qCo';o='samuel-girven-VJ2s0c20qCo-unsplash.jpg'},
 @{n=7;d='Guantes de boxeo y equipo de combate';s='https://unsplash.com/photos/0A_b9G-Rm6w';o='boxed-water-is-better-0A_b9G-Rm6w-unsplash.jpg'},
 @{n=8;d='Entrenamiento funcional con cuerda de batalla';s='https://unsplash.com/photos/20jX9b35r_M';o='alora-griffiths-20jX9b35r_M-unsplash.jpg'},
 @{n=9;d='Kettlebells alineados en gimnasio';s='https://unsplash.com/photos/CPSjcuuV8E8';o='heidi-erickson-CPSjcuuV8E8-unsplash.jpg'},
 @{n=10;d='Máquina de entrenamiento de fuerza en gimnasio';s='https://unsplash.com/photos/eM6WUs4nKMY';o='brett-jordan-eM6WUs4nKMY-unsplash.jpg'},
 @{n=11;d='Clase de entrenamiento con implementos en estudio';s='https://unsplash.com/photos/gJtDg6WfMlQ';o='bruce-mars-gJtDg6WfMlQ-unsplash.jpg'},
 @{n=12;d='Barra y discos en suelo de gimnasio';s='https://unsplash.com/photos/y0SMHt74yqc';o='victor-freitas-y0SMHt74yqc-unsplash.jpg'},
 @{n=13;d='Atleta entrenando con barra olímpica';s='https://unsplash.com/photos/h4i9G-de7Po';o='victor-freitas-h4i9G-de7Po-unsplash.jpg'},
 @{n=14;d='Entrenadora con implementos de ejercicio';s='https://unsplash.com/photos/NbpUVe-bW74';o='geert-pieters-NbpUVe-bW74-unsplash.jpg'},
 @{n=15;d='Accesorios de fitness con banda elástica';s='https://unsplash.com/photos/00ByEXKcSkA';o='kelly-sikkema-00ByEXKcSkA-unsplash.jpg'},
 @{n=16;d='Mancuernas y accesorios de entrenamiento';s='https://unsplash.com/photos/KblIFRq1jkg';o='alina-chernysheva-KblIFRq1jkg-unsplash.jpg'},
 @{n=17;d='Zona de pesas con barras y discos';s='https://unsplash.com/photos/7kEpUPB8vNk';o='victor-freitas-7kEpUPB8vNk-unsplash.jpg'},
 @{n=18;d='Hombre entrenando con mancuernas en gimnasio';s='https://unsplash.com/photos/FHnnjk1Yj7Y';o='anastase-maragos-FHnnjk1Yj7Y-unsplash.jpg'},
 @{n=19;d='Equipo de entrenamiento funcional en gimnasio';s='https://unsplash.com/photos/FP7cfYPPUKM';o='scott-webb-FP7cfYPPUKM-unsplash.jpg'},
 @{n=20;d='Sala de gimnasio con máquinas y pesas';s='https://unsplash.com/photos/20jX9b35r_M-alt';o='risen-wang-20jX9b35r_M-unsplash.jpg'}
)
foreach($i in $imp){ $rows += [pscustomobject]@{category_slug='implementos';candidate_number=$i.n;candidate_file=("src/assets/images/catalog-candidates/implementos/candidate-{0:00}.webp" -f $i.n);description=$i.d;source_url=$i.s;license='Unsplash License (https://unsplash.com/license) | verificación documental pendiente por archivo';original_filename=$i.o;optimized_filename=("candidate-{0:00}.webp" -f $i.n);reviewer_approval='PENDING'} }
$ropa = @(
 @{n=1;d='Modelo con conjunto deportivo amarillo';s='https://unsplash.com/photos/5gkYsrH_ebY';o='dom-hill-5gkYsrH_ebY-unsplash.jpg'},
 @{n=2;d='Ropa deportiva doblada para entrenamiento';s='https://unsplash.com/photos/opxOfz81Y0I';o='tyler-nix-opxOfz81Y0I-unsplash.jpg'},
 @{n=3;d='Hombre corriendo con ropa deportiva';s='https://unsplash.com/photos/npMZ4OqM0Qw';o='tyler-nix-npMZ4OqM0Qw-unsplash.jpg'},
 @{n=4;d='Camiseta blanca deportiva en fondo limpio';s='https://unsplash.com/photos/WWesmHEgXDs';o='anomaly-WWesmHEgXDs-unsplash.jpg'},
 @{n=5;d='Camiseta deportiva colgada en perchero';s='https://unsplash.com/photos/xCM0vM2F-3g';o='ryan-hoffman-xCM0vM2F-3g-unsplash.jpg'},
 @{n=6;d='Mujer en conjunto deportivo durante entrenamiento';s='https://unsplash.com/photos/Y1drF0Y3Oe0';o='bruce-mars-Y1drF0Y3Oe0-unsplash.jpg'},
 @{n=7;d='Conjunto deportivo femenino en gimnasio';s='https://unsplash.com/photos/5IsdIqwwNP4';o='tyler-nix-5IsdIqwwNP4-unsplash.jpg'},
 @{n=8;d='Mujer con atuendo deportivo urbano';s='https://unsplash.com/photos/_3Q3tsJ01nc';o='dom-hill-_3Q3tsJ01nc-unsplash.jpg'},
 @{n=9;d='Mujer corriendo con ropa deportiva';s='https://unsplash.com/photos/n8JbWAB9Ypw';o='kike-vega-n8JbWAB9Ypw-unsplash.jpg'},
 @{n=10;d='Chaqueta deportiva sobre fondo neutro';s='https://unsplash.com/photos/mGj0Xf2O6ns';o='md-salman-mGj0Xf2O6ns-unsplash.jpg'},
 @{n=11;d='Chaqueta deportiva negra en perchero';s='https://unsplash.com/photos/Nv4QHkTVEaI';o='caio-coelho-Nv4QHkTVEaI-unsplash.jpg'},
 @{n=12;d='Sudadera deportiva colgada';s='https://unsplash.com/photos/WWesmHEgXDs-2';o='the-creative-exchange-WWesmHEgXDs-unsplash.jpg'},
 @{n=13;d='Mujer con atuendo deportivo elegante';s='https://unsplash.com/photos/9UGur_5F9U8';o='tamara-bellis-9UGur_5F9U8-unsplash.jpg'},
 @{n=14;d='Ropa y accesorios deportivos para entrenamiento';s='https://unsplash.com/photos/FodEsaNZs48';o='anastase-maragos-FP7cfYPPUKM-unsplash.jpg'},
 @{n=15;d='Hombre con camiseta negra deportiva';s='https://unsplash.com/photos/Ws4dJZ_8mO4';o='ian-dooley-Ws4dJZ_8mO4-unsplash.jpg'},
 @{n=16;d='Camisetas deportivas dobladas en estante';s='https://unsplash.com/photos/h8h5YF_9g4A';o='parker-burchfield-h8h5YF_9g4A-unsplash.jpg'},
 @{n=17;d='Ropa deportiva colgada en exhibición';s='https://unsplash.com/photos/PSX_1S4zKzY';o='priscilla-du-preez-PSX_1S4zKzY-unsplash.jpg'},
 @{n=18;d='Conjunto de ropa deportiva ordenada';s='https://unsplash.com/photos/Hp6zYM9b1Hs';o='priscilla-du-preez-Hp6zYM9b1Hs-unsplash.jpg'},
 @{n=19;d='Modelo con ropa deportiva en estudio';s='https://unsplash.com/photos/RrZQx20dS_U';o='tyler-nix-RrZQx20dS_U-unsplash.jpg'},
 @{n=20;d='Camiseta deportiva en fondo liso';s='https://unsplash.com/photos/7cERndkOyDw';o='hensley-event-rentals-7cERndkOyDw-unsplash.jpg'}
)
foreach($i in $ropa){ $rows += [pscustomobject]@{category_slug='ropa';candidate_number=$i.n;candidate_file=("src/assets/images/catalog-candidates/ropa/candidate-{0:00}.webp" -f $i.n);description=$i.d;source_url=$i.s;license='Unsplash License (https://unsplash.com/license) | verificación documental pendiente por archivo';original_filename=$i.o;optimized_filename=("candidate-{0:00}.webp" -f $i.n);reviewer_approval='PENDING'} }
$sup = @(
 @{n=1;d='Polvo de suplemento junto a envase y cuchara dosificadora';s='https://unsplash.com/photos/3j8X6Wq2G_0';o='supliful-supplements-on-demand-3j8X6Wq2G_0-unsplash.jpg';v=$true},
 @{n=2;d='Proteína en polvo con scoop sobre mesa';s='https://unsplash.com/photos/_j2Iu4m7YkQ';o='john-fornander-_j2Iu4m7YkQ-unsplash.jpg';v=$true},
 @{n=3;d='Suplementos y vitaminas en frascos';s='https://unsplash.com/photos/VWcPlbHglYc';o='towfiqu-barbhuiya-VWcPlbHglYc-unsplash.jpg';v=$true},
 @{n=4;d='Vitaminas y cápsulas en envases';s='https://unsplash.com/photos/FT9Yz6C7V1g';o='towfiqu-barbhuiya-FT9Yz6C7V1g-unsplash.jpg';v=$true},
 @{n=5;d='Suplementos y vitaminas sobre superficie clara';s='https://unsplash.com/photos/5T7bDgV6KqA';o='towfiqu-barbhuiya-5T7bDgV6KqA-unsplash.jpg';v=$true},
 @{n=6;d='Cápsulas de suplementos en frasco';s='https://unsplash.com/photos/pJ_DCj9KswI';o='freestocks-pJ_DCj9KswI-unsplash.jpg';v=$true},
 @{n=7;d='Frascos de suplementos nutricionales';s='UNVERIFIED';o='UNVERIFIED';v=$false},
 @{n=8;d='Vitaminas en frascos con etiquetas';s='UNVERIFIED';o='UNVERIFIED';v=$false},
 @{n=9;d='Cápsulas medicinales y suplementos';s='UNVERIFIED';o='UNVERIFIED';v=$false},
 @{n=10;d='Frascos de suplementos alineados';s='UNVERIFIED';o='UNVERIFIED';v=$false},
 @{n=11;d='Suplementos en cápsulas sobre fondo neutro';s='UNVERIFIED';o='UNVERIFIED';v=$false},
 @{n=12;d='Tabletas y vitaminas en envases';s='UNVERIFIED';o='UNVERIFIED';v=$false},
 @{n=13;d='Suplementos nutricionales en mesa';s='UNVERIFIED';o='UNVERIFIED';v=$false},
 @{n=14;d='Envases de suplementos deportivos';s='UNVERIFIED';o='UNVERIFIED';v=$false},
 @{n=15;d='Vitaminas y estilo de vida saludable';s='UNVERIFIED';o='UNVERIFIED';v=$false},
 @{n=16;d='Suplementos y productos de bienestar';s='UNVERIFIED';o='UNVERIFIED';v=$false},
 @{n=17;d='Cápsulas y frascos de suplementos';s='UNVERIFIED';o='UNVERIFIED';v=$false},
 @{n=18;d='Suplementos en presentación limpia';s='UNVERIFIED';o='UNVERIFIED';v=$false},
 @{n=19;d='Vitaminas en envase sobre fondo claro';s='UNVERIFIED';o='UNVERIFIED';v=$false},
 @{n=20;d='Suplementos nutricionales en frascos';s='UNVERIFIED';o='UNVERIFIED';v=$false}
)
foreach($i in $sup){ $desc=$i.d; if(-not $i.v){ $desc = $desc + ' [Fuente original pendiente de verificación]' }; $rows += [pscustomobject]@{category_slug='suplementos';candidate_number=$i.n;candidate_file=("src/assets/images/catalog-candidates/suplementos/candidate-{0:00}.webp" -f $i.n);description=$desc;source_url=$i.s;license='Unsplash License (https://unsplash.com/license) | verificación documental pendiente por archivo';original_filename=$i.o;optimized_filename=("candidate-{0:00}.webp" -f $i.n);reviewer_approval='PENDING'} }
$rows | Export-Csv docs/catalog-image-mapping.csv -NoTypeInformation -Encoding UTF8
$rows.Count