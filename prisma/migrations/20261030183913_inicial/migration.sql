-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario` VARCHAR(30) NOT NULL,
    `hashContrasena` VARCHAR(255) NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `usuarios_usuario_key`(`usuario`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sesiones` (
    `id` CHAR(64) NOT NULL,
    `usuarioId` INTEGER NOT NULL,
    `expiraEn` DATETIME(3) NOT NULL,
    `creadaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sesiones_usuarioId_idx`(`usuarioId`),
    INDEX `sesiones_expiraEn_idx`(`expiraEn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invitaciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hashCodigo` CHAR(64) NOT NULL,
    `terminacion` VARCHAR(4) NOT NULL,
    `creadaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiraEn` DATETIME(3) NOT NULL,
    `usadaEn` DATETIME(3) NULL,
    `creadaPorId` INTEGER NULL,
    `usadaPorId` INTEGER NULL,

    UNIQUE INDEX `invitaciones_hashCodigo_key`(`hashCodigo`),
    UNIQUE INDEX `invitaciones_usadaPorId_key`(`usadaPorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `limite_intentos` (
    `clave` VARCHAR(191) NOT NULL,
    `intentos` INTEGER NOT NULL,
    `reiniciaEn` DATETIME(3) NOT NULL,

    INDEX `limite_intentos_reiniciaEn_idx`(`reiniciaEn`),
    PRIMARY KEY (`clave`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `catalogos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(80) NOT NULL,
    `slug` VARCHAR(80) NOT NULL,
    `icono` VARCHAR(40) NULL,
    `color` CHAR(7) NOT NULL,
    `orden` INTEGER NOT NULL DEFAULT 0,
    `visible` BOOLEAN NOT NULL DEFAULT true,
    `permanente` BOOLEAN NOT NULL DEFAULT false,
    `fotoPortada` VARCHAR(255) NULL,
    `presentacion` TEXT NULL,
    `destacados` TEXT NULL,
    `folletoPdf` VARCHAR(255) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `catalogos_slug_key`(`slug`),
    INDEX `catalogos_orden_idx`(`orden`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `temporadas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `catalogoId` INTEGER NOT NULL,
    `mesInicio` TINYINT NOT NULL,
    `mesFin` TINYINT NOT NULL,
    `todoElAnio` BOOLEAN NOT NULL DEFAULT false,
    `textoAviso` VARCHAR(160) NULL,
    `prioridad` INTEGER NOT NULL DEFAULT 0,
    `visible` BOOLEAN NOT NULL DEFAULT true,
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `temporadas_catalogoId_key`(`catalogoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `configuracion_sitio` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `modoTemporada` ENUM('AUTOMATICA', 'FORZADA', 'FIJA_TODO_EL_ANIO') NOT NULL DEFAULT 'AUTOMATICA',
    `temporadaForzadaId` INTEGER NULL,
    `mostrarDisponibilidad` BOOLEAN NOT NULL DEFAULT false,
    `actualizadoEn` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `datos_negocio` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `whatsapp` VARCHAR(10) NULL,
    `telefonos` VARCHAR(255) NULL,
    `correo` VARCHAR(191) NULL,
    `horario` VARCHAR(191) NULL,
    `horarioEspecial` VARCHAR(255) NULL,
    `direccion` VARCHAR(255) NULL,
    `enlaceMaps` VARCHAR(500) NULL,
    `mapaSrc` VARCHAR(1000) NULL,
    `facebook` VARCHAR(255) NULL,
    `instagram` VARCHAR(255) NULL,
    `actualizadoEn` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `colores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(40) NOT NULL,
    `hex` CHAR(7) NOT NULL,
    `orden` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `colores_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `macetas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(40) NOT NULL,
    `orden` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `macetas_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plantas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(120) NOT NULL,
    `slug` VARCHAR(140) NOT NULL,
    `variedad` VARCHAR(120) NULL,
    `catalogoId` INTEGER NOT NULL,
    `riegoDiasSemana` TINYINT NULL,
    `cantidadAgua` ENUM('POCA', 'MODERADA', 'ABUNDANTE') NULL,
    `fertilizanteId` INTEGER NULL,
    `notaRiego` VARCHAR(255) NULL,
    `descripcionCorta` VARCHAR(500) NULL,
    `cuidados` TEXT NULL,
    `etiqueta` ENUM('NUEVO', 'OFERTA') NULL,
    `disponible` BOOLEAN NOT NULL DEFAULT true,
    `visible` BOOLEAN NOT NULL DEFAULT true,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `plantas_slug_key`(`slug`),
    INDEX `plantas_catalogoId_idx`(`catalogoId`),
    INDEX `plantas_visible_idx`(`visible`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `planta_luces` (
    `plantaId` INTEGER NOT NULL,
    `luz` ENUM('SOL', 'MEDIA_SOMBRA', 'SOMBRA') NOT NULL,

    PRIMARY KEY (`plantaId`, `luz`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `planta_colores` (
    `plantaId` INTEGER NOT NULL,
    `colorId` INTEGER NOT NULL,

    INDEX `planta_colores_colorId_idx`(`colorId`),
    PRIMARY KEY (`plantaId`, `colorId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `planta_macetas` (
    `plantaId` INTEGER NOT NULL,
    `macetaId` INTEGER NOT NULL,

    INDEX `planta_macetas_macetaId_idx`(`macetaId`),
    PRIMARY KEY (`plantaId`, `macetaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fotos_planta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `plantaId` INTEGER NOT NULL,
    `archivo` VARCHAR(255) NOT NULL,
    `ancho` INTEGER NOT NULL,
    `alto` INTEGER NOT NULL,
    `orden` INTEGER NOT NULL DEFAULT 0,
    `esPortada` BOOLEAN NOT NULL DEFAULT false,
    `creadaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fotos_planta_plantaId_orden_idx`(`plantaId`, `orden`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fertilizantes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(120) NOT NULL,
    `tipo` VARCHAR(60) NULL,
    `paraQueSirve` TEXT NULL,
    `dosis` VARCHAR(191) NULL,
    `frecuencia` VARCHAR(191) NULL,
    `pasosAplicacion` TEXT NULL,
    `precauciones` TEXT NULL,
    `presentacion` VARCHAR(191) NULL,
    `foto` VARCHAR(255) NULL,
    `visible` BOOLEAN NOT NULL DEFAULT true,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fertilizante_catalogos` (
    `fertilizanteId` INTEGER NOT NULL,
    `catalogoId` INTEGER NOT NULL,

    INDEX `fertilizante_catalogos_catalogoId_idx`(`catalogoId`),
    PRIMARY KEY (`fertilizanteId`, `catalogoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `anuncios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipoMedio` ENUM('IMAGEN', 'VIDEO') NOT NULL DEFAULT 'IMAGEN',
    `archivo` VARCHAR(255) NULL,
    `archivoMovil` VARCHAR(255) NULL,
    `imagenEspera` VARCHAR(255) NULL,
    `imagenConTexto` BOOLEAN NOT NULL DEFAULT false,
    `textoPequeno` VARCHAR(120) NULL,
    `titulo` VARCHAR(160) NULL,
    `texto` VARCHAR(300) NULL,
    `boton1Texto` VARCHAR(60) NULL,
    `boton1Destino` VARCHAR(500) NULL,
    `boton2Texto` VARCHAR(60) NULL,
    `boton2Destino` VARCHAR(500) NULL,
    `posicionTexto` ENUM('IZQUIERDA', 'CENTRO', 'DERECHA') NOT NULL DEFAULT 'IZQUIERDA',
    `oscurecido` TINYINT NOT NULL DEFAULT 50,
    `temporadaId` INTEGER NULL,
    `desde` DATE NULL,
    `hasta` DATE NULL,
    `visible` BOOLEAN NOT NULL DEFAULT true,
    `orden` INTEGER NOT NULL DEFAULT 0,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    INDEX `anuncios_visible_orden_idx`(`visible`, `orden`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nosotros_contenido` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `seccion` ENUM('HISTORIA', 'MISION', 'VISION', 'VALORES') NOT NULL,
    `texto` TEXT NULL,
    `fotoSuperior` VARCHAR(255) NULL,
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `nosotros_contenido_seccion_key`(`seccion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nosotros_galeria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `seccion` ENUM('HISTORIA', 'MISION', 'VISION', 'VALORES') NOT NULL,
    `archivo` VARCHAR(255) NOT NULL,
    `ancho` INTEGER NOT NULL,
    `alto` INTEGER NOT NULL,
    `orden` INTEGER NOT NULL DEFAULT 0,

    INDEX `nosotros_galeria_seccion_orden_idx`(`seccion`, `orden`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nosotros_valores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(120) NOT NULL,
    `descripcion` TEXT NULL,
    `orden` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nosotros_momentos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(60) NOT NULL,
    `texto` TEXT NULL,
    `foto` VARCHAR(255) NULL,
    `orden` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `preguntas_frecuentes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pregunta` VARCHAR(255) NOT NULL,
    `respuesta` TEXT NOT NULL,
    `orden` INTEGER NOT NULL DEFAULT 0,
    `creadaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `testimonios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(120) NOT NULL,
    `texto` TEXT NOT NULL,
    `avatar` VARCHAR(255) NULL,
    `visible` BOOLEAN NOT NULL DEFAULT true,
    `orden` INTEGER NOT NULL DEFAULT 0,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mensajes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(120) NOT NULL,
    `contacto` VARCHAR(191) NOT NULL,
    `texto` TEXT NOT NULL,
    `leido` BOOLEAN NOT NULL DEFAULT false,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `mensajes_leido_idx`(`leido`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `novedades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(160) NOT NULL,
    `texto` TEXT NOT NULL,
    `imagen` VARCHAR(255) NULL,
    `visible` BOOLEAN NOT NULL DEFAULT true,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sesiones` ADD CONSTRAINT `sesiones_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitaciones` ADD CONSTRAINT `invitaciones_creadaPorId_fkey` FOREIGN KEY (`creadaPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitaciones` ADD CONSTRAINT `invitaciones_usadaPorId_fkey` FOREIGN KEY (`usadaPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `temporadas` ADD CONSTRAINT `temporadas_catalogoId_fkey` FOREIGN KEY (`catalogoId`) REFERENCES `catalogos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `configuracion_sitio` ADD CONSTRAINT `configuracion_sitio_temporadaForzadaId_fkey` FOREIGN KEY (`temporadaForzadaId`) REFERENCES `temporadas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plantas` ADD CONSTRAINT `plantas_catalogoId_fkey` FOREIGN KEY (`catalogoId`) REFERENCES `catalogos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plantas` ADD CONSTRAINT `plantas_fertilizanteId_fkey` FOREIGN KEY (`fertilizanteId`) REFERENCES `fertilizantes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planta_luces` ADD CONSTRAINT `planta_luces_plantaId_fkey` FOREIGN KEY (`plantaId`) REFERENCES `plantas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planta_colores` ADD CONSTRAINT `planta_colores_plantaId_fkey` FOREIGN KEY (`plantaId`) REFERENCES `plantas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planta_colores` ADD CONSTRAINT `planta_colores_colorId_fkey` FOREIGN KEY (`colorId`) REFERENCES `colores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planta_macetas` ADD CONSTRAINT `planta_macetas_plantaId_fkey` FOREIGN KEY (`plantaId`) REFERENCES `plantas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planta_macetas` ADD CONSTRAINT `planta_macetas_macetaId_fkey` FOREIGN KEY (`macetaId`) REFERENCES `macetas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fotos_planta` ADD CONSTRAINT `fotos_planta_plantaId_fkey` FOREIGN KEY (`plantaId`) REFERENCES `plantas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fertilizante_catalogos` ADD CONSTRAINT `fertilizante_catalogos_fertilizanteId_fkey` FOREIGN KEY (`fertilizanteId`) REFERENCES `fertilizantes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fertilizante_catalogos` ADD CONSTRAINT `fertilizante_catalogos_catalogoId_fkey` FOREIGN KEY (`catalogoId`) REFERENCES `catalogos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `anuncios` ADD CONSTRAINT `anuncios_temporadaId_fkey` FOREIGN KEY (`temporadaId`) REFERENCES `temporadas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
