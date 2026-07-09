export const buildFamilyArticlePayload = (data: any) => ({
  name: data.name,
  patientId: data.patientId,
  unitsPerPackage: data.unitsPerPackage,
  quantity: data.quantity,
  fromFamily: true,
});