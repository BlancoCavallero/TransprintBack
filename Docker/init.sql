-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `mydb` DEFAULT CHARACTER SET utf8 ;
USE `mydb` ;

-- -----------------------------------------------------
-- Table `mydb`.`Provincia`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Provincia` (
  `idProvincia` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(45) NULL,
  PRIMARY KEY (`idProvincia`),
  UNIQUE INDEX `idProvincia_UNIQUE` (`idProvincia` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Localidad`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Localidad` (
  `idLocalidad` INT NOT NULL AUTO_INCREMENT,
  `codPostal` INT NULL,
  `nombre` VARCHAR(45) NULL,
  `idProvincia` INT NOT NULL,
  PRIMARY KEY (`idLocalidad`, `idProvincia`),
  INDEX `fk_Localidad_Provincia_idx` (`idProvincia` ASC) VISIBLE,
  UNIQUE INDEX `idLocalidad_UNIQUE` (`idLocalidad` ASC) VISIBLE,
  CONSTRAINT `fk_Localidad_Provincia`
    FOREIGN KEY (`idProvincia`)
    REFERENCES `mydb`.`Provincia` (`idProvincia`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Usuario`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Usuario` (
  `idUsuario` INT NOT NULL AUTO_INCREMENT,
  `contraseña` VARCHAR(45) NULL,
  `nombreUsuario` VARCHAR(45) NULL,
  `rol` VARCHAR(45) NULL,
  PRIMARY KEY (`idUsuario`),
  UNIQUE INDEX `idUsuario_UNIQUE` (`idUsuario` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Chofer`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Chofer` (
  `idChofer` INT NOT NULL AUTO_INCREMENT,
  `dni` INT NULL,
  `estadoDisponibilidad` VARCHAR(45) NULL,
  PRIMARY KEY (`idChofer`),
  UNIQUE INDEX `idChofer_UNIQUE` (`idChofer` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Persona`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Persona` (
  `idPersona` INT NOT NULL AUTO_INCREMENT,
  `cuit` INT(12) NULL,
  `nombre` VARCHAR(45) NULL,
  `apellido` VARCHAR(45) NULL,
  `idUsuario` INT NOT NULL,
  `idChofer` INT NOT NULL,
  PRIMARY KEY (`idPersona`, `idUsuario`, `idChofer`),
  INDEX `fk_Persona_Usuario1_idx` (`idUsuario` ASC) VISIBLE,
  INDEX `fk_Persona_Chofer1_idx` (`idChofer` ASC) VISIBLE,
  UNIQUE INDEX `idPersona_UNIQUE` (`idPersona` ASC) VISIBLE,
  CONSTRAINT `fk_Persona_Usuario1`
    FOREIGN KEY (`idUsuario`)
    REFERENCES `mydb`.`Usuario` (`idUsuario`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Persona_Chofer1`
    FOREIGN KEY (`idChofer`)
    REFERENCES `mydb`.`Chofer` (`idChofer`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Cliente`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Cliente` (
  `idCliente` INT NOT NULL AUTO_INCREMENT,
  `codPostal` INT NULL,
  `correo` VARCHAR(45) NULL,
  `observaciones` VARCHAR(45) NULL,
  `razonSocial` VARCHAR(45) NULL,
  `tipo` VARCHAR(45) NULL,
  `idLocalidad` INT NOT NULL,
  `idProvincia` INT NOT NULL,
  `idPersona` INT NOT NULL,
  `idUsuario` INT NOT NULL,
  `idChofer` INT NOT NULL,
  PRIMARY KEY (`idCliente`, `idLocalidad`, `idProvincia`, `idPersona`, `idUsuario`, `idChofer`),
  INDEX `fk_Cliente_Localidad1_idx` (`idLocalidad` ASC, `idProvincia` ASC) VISIBLE,
  UNIQUE INDEX `idCliente_UNIQUE` (`idCliente` ASC) VISIBLE,
  INDEX `fk_Cliente_Persona1_idx` (`idPersona` ASC, `idUsuario` ASC, `idChofer` ASC) VISIBLE,
  CONSTRAINT `fk_Cliente_Localidad1`
    FOREIGN KEY (`idLocalidad` , `idProvincia`)
    REFERENCES `mydb`.`Localidad` (`idLocalidad` , `idProvincia`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Cliente_Persona1`
    FOREIGN KEY (`idPersona` , `idUsuario` , `idChofer`)
    REFERENCES `mydb`.`Persona` (`idPersona` , `idUsuario` , `idChofer`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Vehiculo`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Vehiculo` (
  `idVehiculo` INT NOT NULL,
  `año` INT NULL,
  `estado` VARCHAR(45) NULL,
  `marca` VARCHAR(45) NULL,
  `modelo` VARCHAR(45) NULL,
  `patente` VARCHAR(10) NULL,
  `tipo` VARCHAR(45) NULL,
  PRIMARY KEY (`idVehiculo`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Viaje`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Viaje` (
  `idViaje` INT NOT NULL AUTO_INCREMENT,
  `estado` VARCHAR(45) NULL,
  `fecha` DATE NULL,
  `kilometros` FLOAT NULL,
  `observaciones` VARCHAR(45) NULL,
  `motivoCancelacion` VARCHAR(45) NULL,
  `precio` FLOAT NULL,
  `idLocalidadDestino` INT NOT NULL,
  `idProvinciaDestino` INT NOT NULL,
  `idCliente` INT NOT NULL,
  `idLocalidadOrigen` INT NOT NULL,
  `idProvinciaOrigen` INT NOT NULL,
  `idVehiculo` INT NOT NULL,
  PRIMARY KEY (`idViaje`, `idLocalidadDestino`, `idProvinciaDestino`, `idCliente`, `idLocalidadOrigen`, `idProvinciaOrigen`, `idVehiculo`),
  INDEX `fk_Viaje_Localidad1_idx` (`idLocalidadDestino` ASC, `idProvinciaDestino` ASC) VISIBLE,
  INDEX `fk_Viaje_Cliente1_idx` (`idCliente` ASC) VISIBLE,
  INDEX `fk_Viaje_Localidad2_idx` (`idLocalidadOrigen` ASC, `idProvinciaOrigen` ASC) VISIBLE,
  UNIQUE INDEX `idViaje_UNIQUE` (`idViaje` ASC) VISIBLE,
  INDEX `fk_Viaje_Vehiculo1_idx` (`idVehiculo` ASC) VISIBLE,
  CONSTRAINT `fk_Viaje_Localidad1`
    FOREIGN KEY (`idLocalidadDestino` , `idProvinciaDestino`)
    REFERENCES `mydb`.`Localidad` (`idLocalidad` , `idProvincia`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Viaje_Cliente1`
    FOREIGN KEY (`idCliente`)
    REFERENCES `mydb`.`Cliente` (`idCliente`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Viaje_Localidad2`
    FOREIGN KEY (`idLocalidadOrigen` , `idProvinciaOrigen`)
    REFERENCES `mydb`.`Localidad` (`idLocalidad` , `idProvincia`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Viaje_Vehiculo1`
    FOREIGN KEY (`idVehiculo`)
    REFERENCES `mydb`.`Vehiculo` (`idVehiculo`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Gasto`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Gasto` (
  `idGasto` INT NOT NULL AUTO_INCREMENT,
  `detalle` VARCHAR(45) NULL,
  `monto` FLOAT NULL,
  `tipo` VARCHAR(45) NULL,
  `idViaje` INT NOT NULL,
  `idLocalidad` INT NOT NULL,
  `idProvincia` INT NOT NULL,
  PRIMARY KEY (`idGasto`, `idViaje`, `idLocalidad`, `idProvincia`),
  INDEX `fk_Gasto_Viaje1_idx` (`idViaje` ASC, `idLocalidad` ASC, `idProvincia` ASC) VISIBLE,
  UNIQUE INDEX `idGasto_UNIQUE` (`idGasto` ASC) VISIBLE,
  CONSTRAINT `fk_Gasto_Viaje1`
    FOREIGN KEY (`idViaje` , `idLocalidad` , `idProvincia`)
    REFERENCES `mydb`.`Viaje` (`idViaje` , `idLocalidadDestino` , `idProvinciaDestino`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Documentacion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Documentacion` (
  `idDocumentacion` INT NOT NULL,
  `detalle` VARCHAR(45) NULL,
  `estado` VARCHAR(45) NULL,
  `nombre` VARCHAR(45) NULL,
  `renovacion` INT NULL,
  `vencimiento` DATE NULL,
  `idVehiculo` INT NOT NULL,
  `idChofer` INT NOT NULL,
  PRIMARY KEY (`idDocumentacion`, `idVehiculo`, `idChofer`),
  INDEX `fk_Documentacion_Vehiculo1_idx` (`idVehiculo` ASC) VISIBLE,
  INDEX `fk_Documentacion_Chofer1_idx` (`idChofer` ASC) VISIBLE,
  CONSTRAINT `fk_Documentacion_Vehiculo1`
    FOREIGN KEY (`idVehiculo`)
    REFERENCES `mydb`.`Vehiculo` (`idVehiculo`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Documentacion_Chofer1`
    FOREIGN KEY (`idChofer`)
    REFERENCES `mydb`.`Chofer` (`idChofer`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`Mantenimiento`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Mantenimiento` (
  `idMantenimiento` INT NOT NULL AUTO_INCREMENT, -- ¡Agregado AUTO_INCREMENT!
  `fecha` DATE NULL,
  `observaciones` VARCHAR(255) NULL, -- Más espacio para observaciones
  `tipo` VARCHAR(45) NULL,
  `idVehiculo` INT NOT NULL,
  PRIMARY KEY (`idMantenimiento`), -- Solo idMantenimiento como PK
  INDEX `fk_Mantenimiento_Vehiculo1_idx` (`idVehiculo` ASC) VISIBLE,
  CONSTRAINT `fk_Mantenimiento_Vehiculo1`
    FOREIGN KEY (`idVehiculo`)
    REFERENCES `mydb`.`Vehiculo` (`idVehiculo`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
