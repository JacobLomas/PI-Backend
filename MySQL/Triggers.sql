CREATE TRIGGER fechaCreacionUsuario 
before insert on clientes
for each row
	set NEW.xfecha_creación = CURDATE();

