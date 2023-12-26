/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log', 'N/ui/serverWidget','N/url'],
    function(record, log, serverWidget,url) {

        function beforeLoad(context) {
            // Check if the record is in view mode (not in edit mode)
           try{
           var currentRecord=context.newRecord;
             var defaultPolicy=currentRecord.getValue('custrecord_gpsod_defaultpolicy');

               // Get the current form
                var form = context.form;

                           var defaultPolicyField = form.getField({
    id : 'custrecord_gpsod_defaultpolicy'
});
               defaultPolicyField.updateDisplayType({
    displayType : serverWidget.FieldDisplayType.HIDDEN
});

             

             if(defaultPolicy)
             {
              

                // Add a button to the form

               var suitelet_Url = url.resolveScript({
                scriptId: 'customscript_sod_makecopy_sl',
                deploymentId: 'customdeploy_sod_makecopy_sl',
                returnExternalUrl: false
            });

            suitelet_Url=suitelet_Url+'&recordId='+currentRecord.id
              
                var copyButton = form.addButton({
                    id: 'custpage_copy_button',
                    label: 'Copy',
                    functionName: "window.open('"+suitelet_Url+"', 'PopupWindow', 'width=800,height=600,scrollbars=yes,resizable=yes');"
                });

               var Remove_Standard_Button=form.removeButton({

               id :'edit',
               });

           
               
             }
         }
         catch(error)
         {
            log.error('error',error);
         }
        }

        return {
            beforeLoad: beforeLoad
        };

    });