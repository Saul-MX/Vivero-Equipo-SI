-- Cambia el acceso al panel a better-auth (usuario y contraseña + Google).
-- Se acordó empezar de cero: se BORRAN las cuentas, sesiones e invitaciones anteriores.
-- La primera cuenta se vuelve a crear con CODIGO_INVITACION_INICIAL.

-- DropTable (primero las que apuntan a «usuarios»)
DROP TABLE IF EXISTS `invitaciones`;
DROP TABLE IF EXISTS `sesiones`;
DROP TABLE IF EXISTS `usuarios`;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` VARCHAR(64) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `correo` VARCHAR(191) NOT NULL,
    `correoVerificado` BOOLEAN NOT NULL DEFAULT false,
    `imagen` TEXT NULL,
    `usuario` VARCHAR(30) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuarios_correo_key`(`correo`),
    UNIQUE INDEX `usuarios_usuario_key`(`usuario`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sesiones` (
    `id` VARCHAR(64) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(64) NOT NULL,
    `expiraEn` DATETIME(3) NOT NULL,
    `ip` VARCHAR(64) NULL,
    `navegador` TEXT NULL,
    `creadaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadaEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sesiones_token_key`(`token`),
    INDEX `sesiones_usuarioId_idx`(`usuarioId`),
    INDEX `sesiones_expiraEn_idx`(`expiraEn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cuentas_acceso` (
    `id` VARCHAR(64) NOT NULL,
    `idEnProveedor` VARCHAR(191) NOT NULL,
    `proveedor` VARCHAR(32) NOT NULL,
    `usuarioId` VARCHAR(64) NOT NULL,
    `tokenAcceso` TEXT NULL,
    `tokenRenovacion` TEXT NULL,
    `tokenId` TEXT NULL,
    `accesoExpiraEn` DATETIME(3) NULL,
    `renovacionExpiraEn` DATETIME(3) NULL,
    `permisos` TEXT NULL,
    `contrasena` VARCHAR(255) NULL,
    `creadaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadaEn` DATETIME(3) NOT NULL,

    INDEX `cuentas_acceso_usuarioId_idx`(`usuarioId`),
    UNIQUE INDEX `cuentas_acceso_proveedor_idEnProveedor_key`(`proveedor`, `idEnProveedor`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verificaciones` (
    `id` VARCHAR(64) NOT NULL,
    `identificador` VARCHAR(191) NOT NULL,
    `valor` TEXT NOT NULL,
    `expiraEn` DATETIME(3) NOT NULL,
    `creadaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadaEn` DATETIME(3) NOT NULL,

    INDEX `verificaciones_identificador_idx`(`identificador`),
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
    `creadaPorId` VARCHAR(64) NULL,
    `usadaPorId` VARCHAR(64) NULL,

    UNIQUE INDEX `invitaciones_hashCodigo_key`(`hashCodigo`),
    UNIQUE INDEX `invitaciones_usadaPorId_key`(`usadaPorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sesiones` ADD CONSTRAINT `sesiones_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cuentas_acceso` ADD CONSTRAINT `cuentas_acceso_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitaciones` ADD CONSTRAINT `invitaciones_creadaPorId_fkey` FOREIGN KEY (`creadaPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitaciones` ADD CONSTRAINT `invitaciones_usadaPorId_fkey` FOREIGN KEY (`usadaPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

