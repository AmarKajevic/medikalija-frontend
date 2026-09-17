import { useUseArticle } from "@features/articles/hooks/useUseArticle"
import { Controller, useForm } from 'react-hook-form'
import { useArticleOptions } from "@features/articles/ui/useArticleOptions"
import { SelectItemsForm } from "@shared/ui/SelectItemsForm/SelectItemsForm"

const UseArticleForm = ({patientId} : {patientId: string}) => {

    const{mutate, isPending} = useUseArticle(patientId)
    const options = useArticleOptions(patientId)
    const {register, handleSubmit, reset, control} = useForm()

    const onSubmit = (data: any) => {
        mutate({
            articleId: data.articleId,
            amount: data.amount
        }, {
            onSuccess: () => {
                reset();
            }
        })
    }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-3 rounded-lg border border-gray-200 p-4 shadow-theme-xs dark:border-gray-800'>
     <Controller
             name="articleId"
             control={control}
             render={({ field, fieldState }) => (
               <div>
                 <SelectItemsForm
                   value={field.value}
                   onChange={field.onChange}
                   options={options}
                 />

                 {fieldState.error && (
                   <p className="text-sm text-error-500">
                     {fieldState.error.message}
                   </p>
                 )}
               </div>
             )}
           />
      <input
      className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
        type="number"
        step="0.01"
        placeholder="Ukupna količina"
        {...register("amount", {
          valueAsNumber: true,
        })}
      />

      <button disabled={isPending} className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:bg-gray-400">
        Dodaj artikal
      </button>
    </form>
  )
}

export default UseArticleForm
