-- Script de Migración - Preserva datos existentes
-- Ejecutar este script en lugar de init.sql para actualizar sin perder datos

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

USE `mydb`;

-- 1. Agregar campo tipoEntidad a Documentacion si no existe
ALTER TABLE `Documentacion` 
ADD COLUMN `tipoEntidad` ENUM('CHOFER','VEHICULO') NULL AFTER `renovacion`;

-- 2. Actualizar tabla Mantenimiento: cambiar campo 'fecha' a 'fechaInicio' y agregar 'fechaFin'
-- Primero, renombramos 'fecha' a 'fechaInicio'
ALTER TABLE `Mantenimiento` 
CHANGE COLUMN `fecha` `fechaInicio` DATE NOT NULL;

-- Agregar fechaFin con la misma fecha que fechaInicio por defecto
ALTER TABLE `Mantenimiento`
ADD COLUMN `fechaFin` DATE NOT NULL DEFAULT CURDATE() AFTER `fechaInicio`;

-- 3. Actualizar tabla Viaje
-- Cambiar 'fecha' a 'fechaInicio' y agregar 'fechaFin'
ALTER TABLE `Viaje`
CHANGE COLUMN `fecha` `fechaInicio` DATE NOT NULL;

ALTER TABLE `Viaje`
ADD COLUMN `fechaFin` DATE NOT NULL DEFAULT CURDATE() AFTER `fechaInicio`;

-- Cambiar 'estado' de VARCHAR a ENUM
ALTER TABLE `Viaje`
MODIFY COLUMN `estado` ENUM('INICIADO','EN CURSO','FINALIZADO','CANCELADO') NOT NULL DEFAULT 'INICIADO';

-- 4. Cambiar restricción de Gasto a ON DELETE CASCADE si está como NO ACTION
ALTER TABLE `Gasto`
DROP FOREIGN KEY `fk_Gasto_Viaje1`,
ADD CONSTRAINT `fk_Gasto_Viaje1`
  FOREIGN KEY (`idViaje`)
  REFERENCES `mydb`.`Viaje` (`idViaje`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

-- 5. Cambiar restricción de Documentacion para CHOFER a CASCADE
ALTER TABLE `Documentacion`
DROP FOREIGN KEY `fk_Documentacion_Chofer1`,
ADD CONSTRAINT `fk_Documentacion_Chofer1`
  FOREIGN KEY (`idChofer`)
  REFERENCES `mydb`.`Chofer` (`idChofer`)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- 6. Cambiar restricción de Documentacion para VEHICULO a CASCADE
ALTER TABLE `Documentacion`
DROP FOREIGN KEY `fk_Documentacion_Vehiculo1`,
ADD CONSTRAINT `fk_Documentacion_Vehiculo1`
  FOREIGN KEY (`idVehiculo`)
  REFERENCES `mydb`.`Vehiculo` (`idVehiculo`)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- 7. Cambiar restricción de Mantenimiento para que sea ON DELETE CASCADE
ALTER TABLE `Mantenimiento`
DROP FOREIGN KEY `fk_Mantenimiento_Vehiculo1`,
ADD CONSTRAINT `fk_Mantenimiento_Vehiculo1`
  FOREIGN KEY (`idVehiculo`)
  REFERENCES `mydb`.`Vehiculo` (`idVehiculo`)
  ON DELETE CASCADE
  ON UPDATE NO ACTION;

-- 8. Cambiar Viaje - Mantenimiento PRIMARY KEY (si es necesario)
ALTER TABLE `Gasto`
DROP PRIMARY KEY,
ADD PRIMARY KEY (`idGasto`, `idViaje`);

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
