/**
 * @NApiVersion 2.1
 */
define([ 'N/search','N/cache','N/record','N/url'],
    /**
     * @param{search} search
     */
    (search,cache,record,url) => {
         const rolesCompletedEvaluation=(Id)=>
           {
             log.audit('rolesCompletedEvaluation',Id)
             var customrecord_gp_sod_evaluation_detailSearchObj = search.create({
                 type: "customrecord_gp_sod_evaluation_detail",
                       filters:
                             [
                             ["custrecord_gp_sod_ed_summary","anyof",Id], 
                              "AND", 
                             ["custrecord_gp_sod_ed_role","noneof","@NONE@"]
                            ],
   columns:
   [
      search.createColumn({
         name: "custrecord_gp_sod_ed_role",
         summary: "GROUP",
         label: "Role Impacted"
      })
   ]
});
 let retrivedResults = getMoreThan1000Results(customrecord_gp_sod_evaluation_detailSearchObj );

 let evaluatedRoles=[];
 for(var res =0;res<retrivedResults.length;res++)
 {
    evaluatedRoles.push(retrivedResults[res].getValue({name:'custrecord_gp_sod_ed_role',summary:'GROUP'}));
 }
 return evaluatedRoles;
           }
        const getSodAccessControlRules=(accessControlPolicy)=>
        {
            search_Filters=[];search_Columns=[];
            search_Filters.push(search.createFilter('custrecord_gp_sodruleset',null,'anyof',accessControlPolicy));
            search_Filters.push(search.createFilter('isinactive',null,'is','F'));
            search_Filters.push(search.createFilter('custrecord_gp_sod_risklevel',null,'is','1'));
            search_Columns.push(search.createColumn('custrecord_gp_sod_basepermission'));
            search_Columns.push(search.createColumn('custrecord_gp_sod_conflictpermission'));
            let sodAccessControlRulesObj = search.create({type:"customrecord_gp_sodrules",filters:search_Filters,columns:search_Columns});
            let retrivedResults = getMoreThan1000Results(sodAccessControlRulesObj);
            let rulesArray=[];
            for(var x =0;x<retrivedResults.length;x++)
            {
                let tempRulesArray=[];
                tempRulesArray.push(retrivedResults[x].getText('custrecord_gp_sod_basepermission'));
                tempRulesArray.push(retrivedResults[x].getText('custrecord_gp_sod_conflictpermission'));
                rulesArray.push(tempRulesArray);
            }
            return rulesArray;
        }
        const getEmployeeRoleData = (summaryRecId) => {
            search_Filters=[];search_Columns=[];
            search_Filters.push(search.createFilter('access',null,'is','T'));
            search_Filters.push(search.createFilter('isinactive',null,'is','F'));
            //search_Filters.push(search.createFilter('internalid',null,'anyof',['892']));
            //search_Filters.push(search.createFilter('internalid',null,'noneof',['3']));
            search_Columns.push(search.createColumn('entityid'));
            search_Columns.push(search.createColumn('role'));

            var employeeSearchObj = search.create({type:"employee",filters:search_Filters,columns:search_Columns});
            var retrivedResults = getMoreThan1000Results(employeeSearchObj);
          log.audit('retrivedResults',retrivedResults);
            var returnResults={};
            var adminEmployess='This Evaluation Report excludes  the following administrative users :\n';
            for(var x =0;x<retrivedResults.length;x++)
            {
               if(returnResults.hasOwnProperty(retrivedResults[x].id))
                {
                    if(retrivedResults[x].getValue('role')=='3')
                    {
                        adminEmployess=adminEmployess+retrivedResults[x].getValue('entityid');
                         adminEmployess=adminEmployess+'\n';
                    }
                    (returnResults[retrivedResults[x].id]).push(retrivedResults[x].getValue('role'));
                }
                else {
                    var tempArray = [];

                    if(retrivedResults[x].getValue('role')=='3')
                    {
                         adminEmployess=adminEmployess+retrivedResults[x].getValue('entityid');
                         adminEmployess=adminEmployess+'\n';
                    }

                        tempArray.push(retrivedResults[x].getValue('role'));
                        returnResults[retrivedResults[x].id] = tempArray;
                }
            }
log.audit('returnResults',removeValues(returnResults));

record.submitFields({
    type: 'customrecord_gp_sod_evaluation_summary',
    id: summaryRecId,
    values: {
        'custrecord_gp_sod_evaluation_note': adminEmployess
    }
});

            return removeValues(returnResults);
        }

        const getSodRuleSet = () => {
            search_Filters=[];search_Columns=[];
            search_Columns.push(search.createColumn({name: "custrecord_gp_sod_ed_basepermission", label: "Base Permission"}));
           // search_Columns.push(search.createColumn({name: "custrecord_gpsod_base_permissionlevel", label: "Base Permission Level"}));
            search_Columns.push(search.createColumn({name: "custrecord_gp_sod_ed_conflictpermission", label: "Conflict To Permission"}));
            search_Columns.push(search.createColumn({name: "custrecord_gpsod_conflic_permissionlevel", label: "Conflict Permission Level"}));

            var customrecord_sod_ruleset_objSearchObj = search.create({type:'customrecord_gpsod_ruleset',filters:search_Filters,columns:search_Columns});
            var retrivedResults = getMoreThan1000Results(customrecord_sod_ruleset_objSearchObj);
            var ruleset=[];
            for(let x=0;x<retrivedResults.length;x++)
            {
                let tempRuleset=[];
                tempRuleset.push(retrivedResults[x].getText('custrecord_gp_sod_ed_basepermission')+'_'+retrivedResults[x].getText('custrecord_gpsod_base_permissionlevel'))
                tempRuleset.push(retrivedResults[x].getText('custrecord_gp_sod_ed_conflictpermission')+'_'+retrivedResults[x].getText('custrecord_gpsod_conflic_permissionlevel'))
                ruleset.push(tempRuleset);
            }
            const cachedData = cache.getCache({ name: 'TempCache', scope: cache.Scope.PROTECTED });
            cachedData.put({ key: 'ruleSetSod', value: ruleset });
        }
        const getRolePermissions=(roleId)=>
        {
            log.debug('roleId',roleId);

            search_Filters=[];search_Columns=[];
            search_Filters.push(search.createFilter('level',null,'noneof',["1","0"]));
            search_Filters.push(search.createFilter('internalid',null,'anyof',roleId));
            search_Columns.push(search.createColumn('permission'));
            search_Columns.push(search.createColumn('internalid'));
            let roleSearchObj=search.create({type:'role',filters:search_Filters,columns:search_Columns});
            let retrivedResults = getMoreThan1000Results(roleSearchObj);
            let permissionJson={};
            for(let x=0;x<retrivedResults.length;x++)
            {
                let roleInternalId=retrivedResults[x].getValue('internalid');
                // log.debug('roleInternalId',roleInternalId);
                if(permissionJson.hasOwnProperty(roleInternalId))
                {
                    (permissionJson[roleInternalId]).push(retrivedResults[x].getText('permission'))
                }
                else
                {
                    let tempArray=[];
                    tempArray.push(retrivedResults[x].getText('permission'))
                    permissionJson[roleInternalId]=tempArray;
                }
            }
            return permissionJson;

        }
        const getRolePermission = (roleId) => {
            search_Filters=[];search_Columns=[];
            search_Filters.push(search.createFilter('permission',null,'anyof','LIST_VENDOR'));
            search_Columns.push(search.createColumn({name: "level", label: "Level"}));
            search_Columns.push(search.createColumn({name: "permission", label: "Permission"}));
            search_Filters.push(search.createFilter('internalid',null,'anyof',roleId));
            var roleSearchObj=search.create({type:'role',filters:search_Filters,columns:search_Columns});
            var retrivedResults = getMoreThan1000Results(roleSearchObj);
            log.debug({title:'roleResults',details: retrivedResults.length});
            log.debug({title:'roleResults',details: retrivedResults});

            var returnResults=[];

            for(var x =0;x<retrivedResults.length;x++)
            {

                var temp={};
                var tempArray=[];
                temp['role']=retrivedResults[x].id;
                if(retrivedResults[x].getValue('level')!='1')
                {
                    for(let i=(retrivedResults[x].getValue('level'))-1;i>0;i--)
                    {
                        (tempArray.push((retrivedResults[x].getText('permission'))+'_'+(returnPermissionLevels(i))))
                    }
                }
                else
                {
                    (tempArray.push((retrivedResults[x].getText('permission')) + '_' + retrivedResults[x].getText('level').toUpperCase()))
                }
                temp['perms']=tempArray;
                returnResults.push(temp);
            }

            log.debug('returnResults',returnResults);

            let GroupedResults=groupBy('role',returnResults);
            log.debug('GroupedResults',GroupedResults);
            return GroupedResults;
        }
      let getSodRules=()=>
        {
        search_Filters=[];search_Columns=[];
            search_Filters.push(search.createFilter('isinactive',null,'is','F'));
            search_Filters.push(search.createFilter('custrecord_gp_sodruleset',null,'is','1'));
            search_Columns.push(search.createColumn('internalid'));

            var sodRulesSearchObj = search.create({type:"customrecord_gp_sodrules",filters:search_Filters,columns:search_Columns});
            var retrivedResults = getMoreThan1000Results(sodRulesSearchObj);
             return retrivedResults;
        }
      let getEvaluationPolicyRecords=()=>
        {
          search_Filters=[];search_Columns=[];
            search_Filters.push(search.createFilter('isinactive',null,'is','F'));
            search_Columns.push(search.createColumn('internalid'));
            search_Columns.push(search.createColumn('name'));
           var sodRulesSearchObj = search.create({type:"customrecord_gp_sod_default_ruleset",filters:search_Filters,columns:search_Columns});
            var retrivedResults = getMoreThan1000Results(sodRulesSearchObj);
             return retrivedResults;
          
        }
        let getMoreThan1000Results=(searchObj)=>
        {
            var resultSet = searchObj.run(),i=0,totalResults=[];
            do{
                var results = resultSet.getRange({start: i, end: i+1000});
                results.forEach(function (slice) {totalResults.push(slice);i++ });
            }while(results.length>=1000)
            return totalResults;
        }
        const groupBy = (key, data) =>
            data.reduce((result, obj) => {
                const value = obj[key];
                result[value] = (result[value] || []).concat(obj);
                return result;
            }, {});

        let returnPermissionLevels=(Level)=>
        {
            let permissionLevels=['VIEW','CREATE','EDIT','FULL'];
            return permissionLevels[Level];
        }
      const getAuditDate=()=>
      {
        let Month=new Date().getMonth();
        let year= new Date().getFullYear();
         return getMonth(Month)+' '+year
      }
      const getMapReduceStatus=(jobId)=>
        {
            let scheduledscriptinstanceSearchObj = search.create({type: "scheduledscriptinstance",
                filters:[["taskid","contains",jobId]],
                columns:[search.createColumn({name: "percentcomplete",summary: "AVG"})]
            });
            let scheduledscriptinstanceSearchObjResult=scheduledscriptinstanceSearchObj.run().getRange(0,1);
            let status=scheduledscriptinstanceSearchObjResult[0].getValue({name: "percentcomplete",summary: "AVG"});
            return status;
        }
        const getFileId=(FileName)=>
        {
            let fileSearchObj = search.create({type: "file",
                filters:[["name","is",FileName] ],
                columns:[ "internalid"]
            });
            let fileResults=fileSearchObj.run().getRange(0,1);
            return fileResults[0].getValue('internalid');
        }
        const getScriptUrl=(SCRIPTID,DEPLOYMENTID)=>
        {
           return url.resolveScript({ scriptId: SCRIPTID, deploymentId: DEPLOYMENTID});
        }
const getMonth=(month)=>
      {
  const monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun",
"Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
        return monthNames[month]
      }
const removeValues=(obj)=>
{
    const result = {};
  for (const [key, values] of Object.entries(obj)) {
    if (!values.includes('3')) {
      result[key] = values;
    }
  }
  return result;
}
        return {getEmployeeRoleData,getRolePermission,getSodRuleSet,getSodRules,getEvaluationPolicyRecords,getAuditDate,getSodAccessControlRules,getRolePermissions,rolesCompletedEvaluation,getMapReduceStatus,getFileId,getScriptUrl}
    });