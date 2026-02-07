-- Migracion Acoplado + ViajeAcoplado (no modifica init.sql)

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

USE `mydb`;

-- -----------------------------------------------------
-- Table mydb.Acoplado
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Acoplado` (
  `idAcoplado` INT NOT NULL AUTO_INCREMENT,
  `patente` VARCHAR(10) NOT NULL,
  `tipo` VARCHAR(45) NULL,
  `marca` VARCHAR(45) NULL,
  `modelo` VARCHAR(45) NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`idAcoplado`),
  UNIQUE INDEX `patente_UNIQUE` (`patente` ASC),
  CONSTRAINT `chk_acoplado_activo`
    CHECK (`activo` IN (0,1))
)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table mydb.ViajeAcoplado
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`ViajeAcoplado` (
  `idViajeAcoplado` INT NOT NULL AUTO_INCREMENT,
  `idViaje` INT NOT NULL,
  `idAcoplado` INT NOT NULL,
  `orden` INT NULL,
  PRIMARY KEY (`idViajeAcoplado`),
  INDEX `fk_ViajeAcoplado_Viaje_idx` (`idViaje` ASC),
  INDEX `fk_ViajeAcoplado_Acoplado_idx` (`idAcoplado` ASC),
  UNIQUE INDEX `viaje_acoplado_unique` (`idViaje`, `idAcoplado`),
  UNIQUE INDEX `viaje_orden_unique` (`idViaje`, `orden`),
  CONSTRAINT `fk_ViajeAcoplado_Viaje`
    FOREIGN KEY (`idViaje`)
    REFERENCES `mydb`.`Viaje` (`idViaje`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_ViajeAcoplado_Acoplado`
    FOREIGN KEY (`idAcoplado`)
    REFERENCES `mydb`.`Acoplado` (`idAcoplado`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `chk_viaje_acoplado_orden`
    CHECK (`orden` IN (0,1))
)
ENGINE = InnoDB;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
