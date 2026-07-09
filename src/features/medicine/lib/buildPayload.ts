export const buildPayload = (data: any, fromFamily: boolean) => {
  const u = Number(data.unitsPerPackage);
  const total = Number(data.quantity);

  const packageCount = u > 0 ? Math.floor(total / u) : 0;
  const loose = u > 0 ? total % u : total;

  return {
    name: data.name,
    fromFamily,
    unitsPerPackage: u,
    packages: packageCount,
    quantity: loose,
    pricePerUnit: data.pricePerUnit,
    patientId: data.patientId,
  };
};