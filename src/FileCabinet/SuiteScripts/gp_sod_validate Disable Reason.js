/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord'],
    function(currentRecord) {
        function validateLine(context) {
            try{
            var currentRecordObj = currentRecord.get();
            var sublistName = context.sublistId;
            if(sublistName==='recmachcustrecord_gp_sodruleset'){
            var sodRiskLevel = currentRecordObj.getCurrentSublistValue({
                sublistId: sublistName,
                fieldId: 'custrecord_gp_sod_risklevel'
            });
            if (sodRiskLevel==='2') {
                var sodRiskLevelReason = currentRecordObj.getCurrentSublistValue({
                sublistId: sublistName,
                fieldId: 'custrecord_gp_sod_disablereason' 
              
            });
                    sodRiskLevelReason=sodRiskLevelReason.replace(/\s/g,'')
//alert('sodRiskLevelReason '+sodRiskLevelReason.length);
                if(sodRiskLevelReason=='' || sodRiskLevelReason==null || sodRiskLevelReason==undefined || sodRiskLevelReason.length<1){
                    alert('Please Enter The Disable Reason'); 
                    return false; // Prevent saving the record
                }
                
            }
}
            return true;
        }
        catch(error)
        {
            log.error('error',error);
        }
        }

        return {
            validateLine: validateLine
        };

    });