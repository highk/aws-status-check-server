import { AutoScalingClient, DescribeAutoScalingInstancesCommand } from "@aws-sdk/client-auto-scaling"; // ES Modules import
const client = new AutoScalingClient({region: "ap-northeast-2"});

const healthyIntances = new Array();
const unhealthyIntances = new Array();


export const getAutoScailingInfo = async () => {
  const command = new DescribeAutoScalingInstancesCommand({})
  try {
    const response = await client.send(command);
    const instacnes = response.AutoScalingInstances;

    instacnes.forEach((instance) => {
      if(instance.HealthStatus === "HEALTHY") {
        healthyIntances.push(instance);
      }
      else {
        unhealthyIntances.push(instance);
      }
    });
    
    return instacnes;
    // return ({
    //     healthyIntances, unhealthyIntances
    // });
  }
  catch (err) {
    return err;
  }
}