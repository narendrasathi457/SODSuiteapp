/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log', 'N/ui/serverWidget','N/url'],
    function(record, log, serverWidget,url) {

        function beforeLoad(context) {
           try{
           var currentRecord=context.newRecord;
           var defaultPolicy=currentRecord.getValue('custrecord_gp_sod_defaultpolicy');
           var form = context.form;
           var defaultPolicyField = form.getField({id : 'custrecord_gp_sod_defaultpolicy'});
           defaultPolicyField.updateDisplayType({displayType : serverWidget.FieldDisplayType.HIDDEN});
             if(defaultPolicy)
             {
               var suitelet_Url = url.resolveScript({
                scriptId: 'customscript_gp_sod_makecopy_sl',
                deploymentId: 'customdeploy_gp_sod_makecopy_sl',
                returnExternalUrl: false
            });

            suitelet_Url=suitelet_Url+'&recordId='+currentRecord.id;

                 form.removeButton({id :'edit'});  // Remove the standard edit button and add custom copy button
              
               form.addButton({
                    id: 'custpage_copy_button',
                    label: 'Copy',
                    functionName: "window.open('"+suitelet_Url+"', 'PopupWindow', 'width=800,height=600,scrollbars=yes,resizable=yes');"
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