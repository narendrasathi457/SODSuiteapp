/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
var fileName='gp_sod_Progressbar.html';
var scriptId_SL='customscript_gp_sod_evaluation_report';
var deploymentId_SL='customdeploy_generate_sod_evaluation';
var scriptId_MR='customscript_gp_sod_generate_rolereport';
var deploymentId_MR='customdeploy_gp_sod_generate_role_audit';
define(['N/ui/serverWidget','N/record','N/runtime','N/file','N/task','N/search','N/redirect','./gp_sod_searchLib.js'], function(serverWidget,record,runtime,file,task,search,redirect,searchLib) {
    function onRequest(context) {
         let sod_Evaluation_Form = serverWidget.createForm('SOD Evaluation Report');
        if (context.request.method === 'GET') {
            try{
                let evaluationRecId=context.request.parameters.SummaryRecId;
                let jobId=context.request.parameters.jobId;
                // check the recordId and retrive the job status
                if(evaluationRecId)
                {
                    log.debug('evaluationRecId',evaluationRecId);
                    let fieldLookUp = search.lookupFields({type: 'customrecord_gp_sod_evaluation_summary',id: evaluationRecId,columns: ['custrecord_gp_sod_evaluation_status']});
                    log.debug('fieldLookUp',fieldLookUp);
                    let htmlField = sod_Evaluation_Form.addField({id : 'custpage_inline_html',type : serverWidget.FieldType.INLINEHTML,label:'Html Field'});
                    let fileObj = file.load({id: searchLib.getFileId(fileName)});
                    let htmlContent=fileObj.getContents();  // load html content from the file cabinet
                    let status=searchLib.getMapReduceStatus(jobId);

                    if(fieldLookUp.custrecord_gp_sod_evaluation_status=='Completed')
                    {
                        redirect.toRecord({ type: 'customrecord_gp_sod_evaluation_summary', id: evaluationRecId}) // redirect to the end record once job is completed.
                    }   
                    else
                    {
                      htmlContent=  htmlContent.replace('NS_WIDTH',status);
                        htmlContent=  htmlContent.replace('SHOW_PERCENT',parseInt(status));

                        log.debug('htmlContent',htmlContent);
                        htmlField.defaultValue=htmlContent;
                    context.response.writePage(sod_Evaluation_Form);
                    }
                    
                }
             else
             {
                    sod_Evaluation_Form.addSubmitButton({label : 'Run SOD Evaluation Report'});
                    let evaluation_Policy = sod_Evaluation_Form.addField({id : 'custpage_evaluation_policy',type : serverWidget.FieldType.SELECT, label : 'Evaluation Policy' });
                    evaluation_Policy.addSelectOption({value : '',text : ''}); 
                    let evaluationSearchResults= searchLib.getEvaluationPolicyRecords();
                   for(var i =0;i<evaluationSearchResults.length;i++)
                         evaluation_Policy.addSelectOption({value :evaluationSearchResults[i].getValue('internalid'),text : evaluationSearchResults[i].getValue('name')});
         
                      context.response.writePage(sod_Evaluation_Form);
            }
}
catch(error)
{
    log.error('error',error);
}
    }
    else
    {

        try{
            //Create SOD Evaluation Summary Record
        
       let evaluationPolicy=context.request.parameters.custpage_evaluation_policy;
       let evaluationSummaryRecord= record.create({ type: 'customrecord_gp_sod_evaluation_summary'});
       evaluationSummaryRecord.setValue('name',searchLib.getAuditDate()+' SOD AUDIT Report');
       evaluationSummaryRecord.setValue('custrecord_gp_sod_reportrunby',runtime.getCurrentUser().id);
       evaluationSummaryRecord.setValue('custrecord_gp_sod_evaluationdatetime',new Date());
       evaluationSummaryRecord.setValue('custrecord_gp_sod_evalutationpolicy',evaluationPolicy);
       evaluationSummaryRecord.setValue('custrecord_gp_sod_evaluation_status','InProgress');
       let SummaryRecId=evaluationSummaryRecord.save();
      
      // Map Reduce task to check the evaluation report
    var mrTask = task.create({
    taskType: task.TaskType.MAP_REDUCE,
    scriptId: scriptId_MR,
    deploymentId: deploymentId_MR,
     params: {
        custscript_gp_sod_evaluation_rec: SummaryRecId,
         custscript_gp_sod_access_control_policy : evaluationPolicy
    }
});
let mrTaskId=mrTask.submit();

if(mrTaskId)
{
    let Suitelet_Url=searchLib.getScriptUrl(scriptId_SL,deploymentId_SL);
    Suitelet_Url=Suitelet_Url+'&SummaryRecId='+SummaryRecId;
    Suitelet_Url=Suitelet_Url+'&jobId='+mrTaskId;
    redirect.redirect({url: Suitelet_Url});
}
}
catch(error){
    log.error('error in else part',error);
}
    }
    }

    return {
        onRequest: onRequest
    };
}); 