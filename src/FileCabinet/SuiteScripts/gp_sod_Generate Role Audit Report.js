/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['./gp_sod_searchLib.js','N/cache','N/record','N/runtime'],
    (searchLib,cache,record,runtime) => {
        const getInputData = (inputContext) => {
            try
            {
                let summaryRecord=runtime.getCurrentScript().getParameter({name: 'custscript_gp_sod_evaluation_rec'}); 
                return searchLib.getEmployeeRoleData(summaryRecord);
            }
            catch(error)
            {
                log.error({title:'Get Input Stage Error',details: error.message})
            }
        }
        const map = (context) => {
            try{

                log.debug('context_key',context.key);
                log.debug('context_value',context.value);

                let evaluationPolicyRecord=runtime.getCurrentScript().getParameter({name: 'custscript_gp_sod_access_control_policy'});

                const cachedvalue = searchLib.getSodAccessControlRules(evaluationPolicyRecord);

                let roles=JSON.parse(context.value);
                let employee=context.key;

                //roles=['1111','1005','1108'];

                let summaryRecord=runtime.getCurrentScript().getParameter({name: 'custscript_gp_sod_evaluation_rec'}); 

                let rolePermissions=searchLib.getRolePermissions([...roles]);
               // log.debug('rolePermissions',rolePermissions);
                

              let CompletedRoles=searchLib.rolesCompletedEvaluation(summaryRecord);

              log.debug('CompletedRoles',CompletedRoles);

                for(let i=0;i<roles.length;i++)
                {
                    let role_Permissions=rolePermissions[roles[i]];


                    let remainingRolePermission=[];
                         let remainingRoles=roles.filter(number => number !== roles[i]);
                     //    log.debug('remainingRoles',remainingRoles);
                         for(var m=0;m<remainingRoles.length;m++)
                         {
                            remainingRolePermission.push(...rolePermissions[remainingRoles[m]])
                         }
                       //  log.debug('remainingRolePermission',remainingRolePermission);


                    for(let j=0;j<cachedvalue.length;j++){
                        if(role_Permissions.indexOf(cachedvalue[j][0])!='-1'){
                            if(CompletedRoles.indexOf(roles[i])=='-1'){
                         if(role_Permissions.indexOf(cachedvalue[j][1])!='-1')
                         {
                            // conflicting permission... create custom record.
                            let gpEvaluationDetailedRec = record.create({type: 'customrecord_gp_sod_evaluation_detail',isDynamic:true});
                            gpEvaluationDetailedRec.setText('custrecord_gp_sod_ed_basepermission',cachedvalue[j][0]);
                            gpEvaluationDetailedRec.setText('custrecord_gp_sod_ed_conflictpermission',cachedvalue[j][1]);
                            gpEvaluationDetailedRec.setValue('custrecord_gp_sod_ed_role',roles[i]);
                             gpEvaluationDetailedRec.setValue('custrecord_gp_sod_ed_summary',summaryRecord);
                             gpEvaluationDetailedRec.save();
                         }
                    }
                     else{
                       log.audit('skipping at 70');
                     }

                         if(remainingRolePermission.indexOf(cachedvalue[j][1])!='-1')
                         {
                            let gpEvaluationDetailedRec = record.create({type: 'customrecord_gp_sod_evaluation_detail',isDynamic:true});
                            gpEvaluationDetailedRec.setText('custrecord_gp_sod_ed_basepermission',cachedvalue[j][0]);
                            gpEvaluationDetailedRec.setText('custrecord_gp_sod_ed_conflictpermission',cachedvalue[j][1]);
                            gpEvaluationDetailedRec.setValue('custrecord_gp_sod_ed_user',employee);
                             gpEvaluationDetailedRec.setValue('custrecord_gp_sod_ed_summary',summaryRecord);
                             gpEvaluationDetailedRec.save();
                         }
                         
                     }
                 }
                     

                }
                

            }
            catch(error)
            {
                log.error({title:'Map Stage Error',details: error})
            }

        }

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {

        }
        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        const summarize = (summaryContext) => {
                log.debug('summaryContext',summaryContext);
                 let summaryRecord=runtime.getCurrentScript().getParameter({name: 'custscript_gp_sod_evaluation_rec'}); 
                  log.debug('summaryRecord',summaryRecord);
                let id= record.submitFields({
                    type: 'customrecord_gp_sod_evaluation_summary',
                    id: summaryRecord,
                    values: {
                        'custrecord_gp_sod_evaluation_status': 'Completed'
                            }
                        });
                    log.audit('id',id);
        }
        return {getInputData, map,reduce,summarize}
    });