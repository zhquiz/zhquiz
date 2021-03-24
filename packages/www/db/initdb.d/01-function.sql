CREATE OR REPLACE FUNCTION "f_updatedAt"()   
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = now();
    RETURN NEW;   
END;
$$ language 'plpgsql';
