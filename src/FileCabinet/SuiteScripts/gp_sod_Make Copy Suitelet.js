/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record','N/config', 'N/redirect','N/ui/serverWidget','N/search','./gp_sod_searchLib.js'], (record,config,redirect,serverWidget,search,searchLib)=> {
    function onRequest(context) {
    if (context.request.method === 'GET') {
       const RecordId = context.request.parameters.recordId;
       let form = serverWidget.createForm('SOD AccessControl Policy');
       let sodAccessName = form.addField({id : 'custpage_sod_name',type : serverWidget.FieldType.TEXT,label : 'SOD Access Name'});
       sodAccessName.defaultValue = config.load({type: config.Type.COMPANY_INFORMATION}).getValue('companyname');
       let sodId = form.addField({id : 'custpage_sod_id',type : serverWidget.FieldType.TEXT,label : 'SOD Id'}).updateDisplayType({displayType : serverWidget.FieldDisplayType.HIDDEN});
       sodId.defaultValue = RecordId;
       form.addSubmitButton({label : 'Submit'});
       context.response.writePage(form);
    }
    else
    {
        let sod_Id=context.request.parameters.custpage_sod_id;
        let sod_Name=context.request.parameters.custpage_sod_name;
        var defaultSodRuleset = record.copy({type:'customrecord_gp_sod_default_ruleset',id: sod_Id,isDynamic: true });
        defaultSodRuleset.setValue('name',sod_Name);
        defaultSodRuleset.setValue('custrecord_gp_sod_defaultpolicy',false);
        var savedRecId=defaultSodRuleset.save();
       

    
            var retrivedResults = searchLib.getSodRules();

            for(var x =0;x<retrivedResults.length;x++)
            {
              let sodRules=record.copy({
                type:'customrecord_gp_sodrules',
                id: retrivedResults[x].getValue('internalid'),
                isDynamic: true
            });
                sodRules.setValue('custrecord_gp_sodruleset',savedRecId);
                sodRules.save();
            }

            redirect.toRecord({
            type: 'customrecord_gp_sod_default_ruleset',
            id: savedRecId
});
    }
    }
    return {
        onRequest: onRequest
    };
});