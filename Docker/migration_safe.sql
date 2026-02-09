-- Migracion segura basada en init.sql (no borra datos)
-- Ejecutar este script en la base existente

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

USE `mydb`;

-- Chofer.activo
SET @col_activo := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Chofer'
    AND COLUMN_NAME = 'activo'
);
SET @sql := IF(
  @col_activo = 0,
  'ALTER TABLE `Chofer` ADD COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 AFTER `dni`',
  'SELECT ''Chofer.activo ya existe'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Chofer.estadoDisponibilidad (eliminar si existe - ya no se usa)
SET @col_estadoDisponibilidad := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Chofer'
    AND COLUMN_NAME = 'estadoDisponibilidad'
);
SET @sql := IF(
  @col_estadoDisponibilidad = 1,
  'ALTER TABLE `Chofer` DROP COLUMN `estadoDisponibilidad`',
  'SELECT ''Chofer.estadoDisponibilidad ya eliminado'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Cliente.activo
SET @col_cliente_activo := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Cliente'
    AND COLUMN_NAME = 'activo'
);
SET @sql := IF(
  @col_cliente_activo = 0,
  'ALTER TABLE `Cliente` ADD COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 AFTER `idCliente`',
  'SELECT ''Cliente.activo ya existe'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Vehiculo.activo
SET @col_vehiculo_activo := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Vehiculo'
    AND COLUMN_NAME = 'activo'
);
SET @sql := IF(
  @col_vehiculo_activo = 0,
  'ALTER TABLE `Vehiculo` ADD COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 AFTER `idVehiculo`',
  'SELECT ''Vehiculo.activo ya existe'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Documentacion.tipoEntidad
SET @col_tipoEntidad := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Documentacion'
    AND COLUMN_NAME = 'tipoEntidad'
);
SET @sql := IF(
  @col_tipoEntidad = 0,
  'ALTER TABLE `Documentacion` ADD COLUMN `tipoEntidad` ENUM(''CHOFER'',''VEHICULO'') NOT NULL AFTER `renovacion`',
  'SELECT ''Documentacion.tipoEntidad ya existe'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Mantenimiento.fecha -> fechaInicio
SET @has_fecha := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Mantenimiento'
    AND COLUMN_NAME = 'fecha'
);
SET @has_fechaInicio := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Mantenimiento'
    AND COLUMN_NAME = 'fechaInicio'
);
SET @sql := IF(
  @has_fecha = 1 AND @has_fechaInicio = 0,
  'ALTER TABLE `Mantenimiento` CHANGE COLUMN `fecha` `fechaInicio` DATE NOT NULL',
  'SELECT ''Mantenimiento.fechaInicio ok'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Mantenimiento.fechaFin
SET @col_fechaFin := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Mantenimiento'
    AND COLUMN_NAME = 'fechaFin'
);
SET @sql := IF(
  @col_fechaFin = 0,
  'ALTER TABLE `Mantenimiento` ADD COLUMN `fechaFin` DATE NOT NULL DEFAULT CURDATE() AFTER `fechaInicio`',
  'SELECT ''Mantenimiento.fechaFin ya existe'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Viaje.fecha -> fechaInicio
SET @has_viaje_fecha := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Viaje'
    AND COLUMN_NAME = 'fecha'
);
SET @has_viaje_fechaInicio := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Viaje'
    AND COLUMN_NAME = 'fechaInicio'
);
SET @sql := IF(
  @has_viaje_fecha = 1 AND @has_viaje_fechaInicio = 0,
  'ALTER TABLE `Viaje` CHANGE COLUMN `fecha` `fechaInicio` DATE NOT NULL',
  'SELECT ''Viaje.fechaInicio ok'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Viaje.fechaFin
SET @viaje_fechaFin := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Viaje'
    AND COLUMN_NAME = 'fechaFin'
);
SET @sql := IF(
  @viaje_fechaFin = 0,
  'ALTER TABLE `Viaje` ADD COLUMN `fechaFin` DATE NOT NULL DEFAULT CURDATE() AFTER `fechaInicio`',
  'SELECT ''Viaje.fechaFin ya existe'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Viaje.estado a ENUM
SET @has_viaje_estado := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Viaje'
    AND COLUMN_NAME = 'estado'
);
SET @sql := IF(
  @has_viaje_estado = 1,
  'ALTER TABLE `Viaje` MODIFY COLUMN `estado` ENUM(''INICIADO'',''EN CURSO'',''FINALIZADO'',''CANCELADO'') NOT NULL DEFAULT ''INICIADO''',
  'SELECT ''Viaje.estado no existe'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- FK Viaje -> Chofer
SET @ref_chofer := (
  SELECT REFERENCED_TABLE_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Viaje'
    AND CONSTRAINT_NAME = 'fk_Viaje_Chofer1'
  LIMIT 1
);
SET @sql := IF(
  @ref_chofer IS NOT NULL AND @ref_chofer <> 'Chofer',
  'ALTER TABLE `Viaje` DROP FOREIGN KEY `fk_Viaje_Chofer1`',
  'SELECT ''fk_Viaje_Chofer1 ok'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ref_chofer := (
  SELECT REFERENCED_TABLE_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Viaje'
    AND CONSTRAINT_NAME = 'fk_Viaje_Chofer1'
  LIMIT 1
);
SET @sql := IF(
  @ref_chofer IS NULL,
  'ALTER TABLE `Viaje` ADD CONSTRAINT `fk_Viaje_Chofer1` FOREIGN KEY (`idChofer`) REFERENCES `Chofer` (`idChofer`) ON DELETE NO ACTION ON UPDATE NO ACTION',
  'SELECT ''fk_Viaje_Chofer1 ok'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- FK Viaje -> Vehiculo
SET @ref_vehiculo := (
  SELECT REFERENCED_TABLE_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Viaje'
    AND CONSTRAINT_NAME = 'fk_Viaje_Vehiculo1'
  LIMIT 1
);
SET @sql := IF(
  @ref_vehiculo IS NOT NULL AND @ref_vehiculo <> 'Vehiculo',
  'ALTER TABLE `Viaje` DROP FOREIGN KEY `fk_Viaje_Vehiculo1`',
  'SELECT ''fk_Viaje_Vehiculo1 ok'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ref_vehiculo := (
  SELECT REFERENCED_TABLE_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Viaje'
    AND CONSTRAINT_NAME = 'fk_Viaje_Vehiculo1'
  LIMIT 1
);
SET @sql := IF(
  @ref_vehiculo IS NULL,
  'ALTER TABLE `Viaje` ADD CONSTRAINT `fk_Viaje_Vehiculo1` FOREIGN KEY (`idVehiculo`) REFERENCES `Vehiculo` (`idVehiculo`) ON DELETE NO ACTION ON UPDATE NO ACTION',
  'SELECT ''fk_Viaje_Vehiculo1 ok'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
