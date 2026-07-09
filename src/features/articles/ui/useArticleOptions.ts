
import { useGetArticles } from "../hooks/useGetArticles"
import { useGetPatientStockArticles } from "../hooks/useGetPatientStockArticles"

type Option = {
  value: string;
  label: string;
  home: number;
  family: number;
};

export const useArticleOptions = (patientId: string) => {
    const {data: articles = []} = useGetArticles()
    const {data: stock = []} = useGetPatientStockArticles(patientId)

    console.log(stock)

    const options: Option[] = articles.map((a: any) => {
        const found = stock.find((s:any) => s._id === a._id)

        return {
            value: a._id,
            label: a.name,
            home: a.quantity,
            family: found?.familyQuantity ?? 0
        }
    })

    return options
}