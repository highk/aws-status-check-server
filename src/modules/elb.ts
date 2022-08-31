import { ElasticLoadBalancingV2Client, DescribeTargetGroupsCommand, DescribeTargetHealthCommand } from "@aws-sdk/client-elastic-load-balancing-v2"; // ES Modules import
const client = new ElasticLoadBalancingV2Client({region: "ap-northeast-2"});


export const getTargetGroup = async () => {
  const command = new DescribeTargetGroupsCommand({})

  try {
    const response = await client.send(command);
    const instanceGroup = await Promise.all(
      response.TargetGroups.map(async (tg) => ({Name: tg.TargetGroupName, Group: await getTargetGroupHealth(tg.TargetGroupArn)}))
    );
    return instanceGroup;
  }
  catch (err) {
    return err;
  }
}

export const getTargetGroupHealth = async (arn) => {
  const command = new DescribeTargetHealthCommand({TargetGroupArn: arn});

  try {
    const response = await client.send(command);
    const instacnes = response.TargetHealthDescriptions;
    return instacnes;
  }
  catch (err) {
    return err;
  }
}