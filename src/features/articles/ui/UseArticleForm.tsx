import { useUseArticle } from '../hooks/useUseArticle'
import { Controller, useForm } from 'react-hook-form'
import { useArticleOptions } from './useArticleOptions'
import { SelectItemsForm } from '../../../shared/ui/SelectItemsForm/SelectItemsForm'

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
    <form onSubmit={handleSubmit(onSubmit)} className='p-2 space-y-2 border-0 border-gray-300 rounded-lg shadow-md'>
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
                   <p className="text-red-500 text-sm">
                     {fieldState.error.message}
                   </p>
                 )}
               </div>
             )}
           />
      <input
      className="border-2 p-2 border-gray-200 text-black rounded-md "
        type="number"
        step="0.01"
        placeholder="Ukupna količina"
        {...register("amount", {
          valueAsNumber: true,
        })}
      />

      <button disabled={isPending} className="bg-zinc-900 p-2 text-shite border-0 border-white rounded-md shadow-md text-white">
        Dodaj artikal
      </button>
    </form>
  )
}

export default UseArticleForm
